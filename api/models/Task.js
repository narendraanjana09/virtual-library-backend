const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  // keep a string id field to match your requirement
  id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
    index: true,
    unique: true,
  },

  userUid: { type: String, required: true, index: true }, // owner (Firebase UID)
  topic: { type: String, required: true },
  labelId: { type: String, default: null }, // refers to Label.id
  labelName: { type: String, default: "" }, // denormalized label name
  date: { type: String, default: "" }, // you can store ISO string "2025-11-05" etc.
  completed: { type: Boolean, default: false },
  color: { type: String, default: "" }, // optional color string (e.g. "#FF0000")
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// update updatedAt on save
taskSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
