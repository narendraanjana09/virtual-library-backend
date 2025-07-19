const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/login", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "idToken is required" });
  }

  try {
    // 1. Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // 2. Check if user exists
    const existingUser = await User.findOne({ uid });

    if (existingUser) {
      // 3. User exists → generate backend JWT token
      const token = jwt.sign({ uid: existingUser.uid }, JWT_SECRET, {
        expiresIn: "30d",
      });

      return res.json({
        registered: true,
        uid,
        token,
      });
    } else {
      const token = jwt.sign({ uid }, JWT_SECRET, { expiresIn: "30d" });
      // 4. User not found
      return res.json({
        registered: false,
        uid,
        token,
      });
    }
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(401).json({ error: "Invalid Firebase ID token" });
  }
});

module.exports = router;
