const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const razorpay = require("../razorpay");
const crypto = require("crypto");

router.get("/pro-plans", verifyJWT, async (req, res) => {
  try {
    const uid = req.uid;
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const exam = user.exam;
    const isPremiumExam = ["NEET PG", "INICT", "FMGE"].includes(exam);

    const plans = isPremiumExam
      ? [
          {
            id: "34eaf2db-4e0e-45d0-b0d0-2d5a2c3e7498",
            durationInMonths: 12,
            price: 999,
            title: "Annual Pro Plan",
            subtitle: "Valid for 1 Year",
          },
          {
            id: "176b3e22-d819-4015-82ab-f875c17cb4f2",
            durationInMonths: 6,
            price: 699,
            title: "Half-Yearly Pro Plan",
            subtitle: "Valid for 6 Months",
          },
          {
            id: "6f08e545-8ad3-4df8-9176-8b9f26365df7",
            durationInMonths: 1,
            price: 199,
            title: "Monthly Pro Plan",
            subtitle: "Valid for 1 Month",
          },
        ]
      : [
          {
            id: "f4d1c30d-5b72-4ec1-95a9-efb0e9279a34",
            durationInMonths: 12,
            price: 699,
            title: "Annual Pro Plan",
            subtitle: "Valid for 1 Year",
          },
          {
            id: "9e64c598-29d1-4e62-932d-7a535fd0f174",
            durationInMonths: 6,
            price: 499,
            title: "Half-Yearly Pro Plan",
            subtitle: "Valid for 6 Months",
          },
          {
            id: "a49d0b95-b33d-49ea-865c-41eb09cd1f49",
            durationInMonths: 1,
            price: 149,
            title: "Monthly Pro Plan",
            subtitle: "Valid for 1 Month",
          },
        ];

    res.json({
      isPremiumExam: isPremiumExam,
      plans: plans,
    });
  } catch (err) {
    console.error("Get Pro Plans Error:", err);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

router.post("/create-order", verifyJWT, async (req, res) => {
  res.status(500).json({ error: "Failed to create Razorpay order" });
  return;
  try {
    const { amount, planDurationInMonths } = req.body;

    const options = {
      amount: amount * 100, // e.g., 19900 for ₹199.00
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        uid: req.uid,
        planDurationInMonths,
      },
    };

    const order = await razorpay.orders.create(options);

    return res.json({ order });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

router.post("/verify", verifyJWT, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planDurationInMonths,
      planType,
      amount,
    } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const user = await User.findOne({ uid: req.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + planDurationInMonths);

    // 1. Update current pro plan
    user.pro = {
      isActive: true,
      planType,
      startDate: now,
      endDate,
      paidAmount: amount,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    };

    // 2. Push into payment history
    user.payments.push({
      amount,
      planType,
      startDate: now,
      endDate,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    await user.save();

    return res.json({
      message: "Payment verified and pro activated",
      user: user,
    });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

router.post(
  "/razorpay",
  express.json({ type: "application/json" }),
  async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers["x-razorpay-signature"];

    // Verify webhook signature
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (generatedSignature !== receivedSignature) {
      console.error("Invalid webhook signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    try {
      const event = req.body;

      if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;

        const uid = payment.notes?.uid; // You should have set this in order notes
        console.log(`Webhook Called ${uid}`);
        const planDurationInMonths = parseInt(
          payment.notes?.planDurationInMonths,
          10
        );
        const planType = planDurationInMonths
          ? planDurationInMonths === 1
            ? "Monthly"
            : planDurationInMonths === 6
            ? "Half Yearly"
            : planDurationInMonths === 12
            ? "Yearly"
            : null
          : null;
        const amount = payment.amount / 100;

        if (!uid || !planDurationInMonths) {
          console.error("Missing payment notes data");
          return res.status(200).json({ status: "ok" }); // Ack but skip processing
        }

        const user = await User.findOne({ uid });
        if (!user) {
          console.error("User not found for UID:", uid);
          return res.status(200).json({ status: "ok" });
        }

        const paymentExists = user.payments.some(
          (p) => p.razorpayPaymentId === payment.id
        );

        // Check if order already exists by Order ID
        const orderExists = user.payments.some(
          (p) => p.razorpayOrderId === payment.order_id
        );

        if (paymentExists || orderExists) {
          console.log(
            `⚠️ Payment ${payment.id} already processed for UID: ${uid}`
          );
          return res.status(200).json({ status: "ok" });
        }

        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + planDurationInMonths);

        // Update pro details
        user.pro = {
          isActive: true,
          planType,
          startDate: now,
          endDate,
          paidAmount: amount,
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          razorpaySignature: null, // Webhook doesn't have signature
        };

        // Add to payments history
        user.payments.push({
          amount,
          planType,
          startDate: now,
          endDate,
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          razorpaySignature: null,
        });

        await user.save();
        console.log("✅ Webhook processed for UID:", uid);
      }

      res.status(200).json({ status: "ok" }); // Always ack to Razorpay
    } catch (error) {
      console.error("Webhook Processing Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
