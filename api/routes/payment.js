const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

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
          { durationInMonths: 1, price: 199 },
          { durationInMonths: 6, price: 699 },
          { durationInMonths: 12, price: 999 },
        ]
      : [
          { durationInMonths: 1, price: 149 },
          { durationInMonths: 6, price: 499 },
          { durationInMonths: 12, price: 699 },
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

module.exports = router;
