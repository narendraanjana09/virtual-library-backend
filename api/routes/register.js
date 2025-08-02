const express = require("express");
const router = express.Router();
const upload = require("multer")(); // Handles multipart/form-data
const verifyJWT = require("../middleware/verifyJWT");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const {
  uploadFileToStorage,
  deleteFromFirebaseStorage,
} = require("../utils/uploadToFirebaseStorage");

router.post(
  "/register",
  verifyJWT,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const uid = req.uid;
      const email = req.body.email;
      const mobile = req.body.mobile;

      const existingUid = await User.findOne({ uid });
      const existingEmail = await User.findOne({ email });
      const existingMobile = await User.findOne({ mobile });

      if (existingUid) {
        return res
          .status(400)
          .json({ error: "User with this UID is already registered" });
      }

      if (existingEmail) {
        return res.status(400).json({ error: "Email is already in use" });
      }

      if (existingMobile) {
        return res
          .status(400)
          .json({ error: "Mobile number is already in use" });
      }

      const imageUrl = await uploadFileToStorage(req.file, "profilePhotos");

      const userData = {
        uid,
        profilePhotoUrl: imageUrl,
        name: req.body.name,
        email: email,
        mobile: mobile,
        gender: req.body.gender,
        college: req.body.college,
        city: req.body.city,
        state: req.body.state,
        exam: req.body.exam,
        pro: {
          isActive: false,
          planType: null,
          startDate: null,
          endDate: null,
          paidAmount: null,
          razorpayOrderId: null,
          razorpayPaymentId: null,
          razorpaySignature: null,
        },
        payments: [],
      };

      const newUser = await User.create(userData);

      return res.json({
        message: "User registered successfully",
        user: newUser,
      });
    } catch (err) {
      console.error("Register Error:", err);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

module.exports = router;
