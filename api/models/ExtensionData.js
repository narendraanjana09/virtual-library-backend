// models/ExtensionData.js
const mongoose = require("mongoose");

const ExtensionDataSchema = new mongoose.Schema(
  {
    data: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true } // adds createdAt, updatedAt
);

module.exports = mongoose.model("ExtensionData", ExtensionDataSchema);
