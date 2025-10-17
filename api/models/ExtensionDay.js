// models/ExtensionData.js
const mongoose = require("mongoose");

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
