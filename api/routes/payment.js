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
          {
            id: "34eaf2db-4e0e-45d0-b0d0-2d5a2c3e7498",
            durationInMonths: 12,
            price: 999,
          },
          {
            id: "176b3e22-d819-4015-82ab-f875c17cb4f2",
            durationInMonths: 6,
            price: 699,
          },
          {
            id: "6f08e545-8ad3-4df8-9176-8b9f26365df7",
            durationInMonths: 1,
            price: 199,
          },
        ]
      : [
          {
            id: "f4d1c30d-5b72-4ec1-95a9-efb0e9279a34",
            durationInMonths: 12,
            price: 699,
          },
          {
            id: "9e64c598-29d1-4e62-932d-7a535fd0f174",
            durationInMonths: 6,
            price: 499,
          },
          {
            id: "a49d0b95-b33d-49ea-865c-41eb09cd1f49",
            durationInMonths: 1,
            price: 149,
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

module.exports = router;
