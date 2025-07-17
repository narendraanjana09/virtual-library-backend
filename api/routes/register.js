const express = require("express");
const router = express.Router();
const upload = require("multer")(); // Handles multipart/form-data
const verifyJWT = require("../middleware/verifyJWT");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const uploadToFirebaseStorage = require("../utils/uploadToFirebaseStorage");

const JWT_SECRET = process.env.JWT_SECRET;

router.post(
  "/register",
  verifyJWT,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const uid = req.uid;

      const existing = await User.findOne({ uid });
      if (existing) {
        return res.status(400).json({ error: "User already registered" });
      }

      const imageUrl = await uploadToFirebaseStorage(req.file);

      const userData = {
        uid,
        profilePhotoUrl: imageUrl,
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        gender: req.body.gender,
        college: req.body.college,
        city: req.body.city,
        state: req.body.state,
        exam: req.body.exam,
      };

      const newUser = await User.create(userData);
      const token = jwt.sign({ uid: uid }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.json({
        message: "User registered successfully",
        user: newUser,
        newToken: token,
      });
    } catch (err) {
      console.error("Register Error:", err);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

module.exports = router;
