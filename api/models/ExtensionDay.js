// models/ExtensionData.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: String,
    imgUrl: String,
    firstSeen: String,
    lastSeen: String,
    present: Boolean,
    lastPresentAt: Number,
    totalSeconds: { type: Number, default: 0 },
    joinCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ExtensionDaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
    meetingId: { type: String, required: false, index: true },
    tickAt: { type: Number }, // last tick epoch seconds
    users: { type: Map, of: UserSchema, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExtensionDay", ExtensionDaySchema);
