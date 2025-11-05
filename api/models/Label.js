const mongoose = require("mongoose");

const labelSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
    index: true,
    unique: true,
  },
  userUid: { type: String, required: true, index: true }, // owner (Firebase UID)
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

labelSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Label = mongoose.model("Label", labelSchema);
module.exports = Label;
