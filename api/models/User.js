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
});

const User = mongoose.model("User", userSchema);

module.exports = User;
