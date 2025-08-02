const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Firebase UID
  profilePhotoUrl: String,
  name: String,
  email: String,
  mobile: String,
  gender: String,
  college: String,
  city: String,
  state: String,
  exam: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  pro: {
    isActive: { type: Boolean, default: false },
    planType: { type: String, default: null },
    startDate: Date,
    endDate: Date,
    paidAmount: Number,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  payments: [
    {
      amount: Number,
      planType: String,
      startDate: Date,
      endDate: Date,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
