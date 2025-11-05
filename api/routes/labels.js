const express = require("express");
const router = express.Router();
const Label = require("../models/Label");
const Task = require("../models/Task");
const verifyJWT = require("../middleware/verifyJWT");

// Create label
router.post("/", verifyJWT, async (req, res) => {
  try {
    const userUid = req.uid;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    // prevent duplicate names per user
    const exists = await Label.findOne({ userUid, name });
    if (exists)
      return res
        .status(400)
        .json({ error: "label with this name already exists" });

    const label = await Label.create({ userUid, name });
    return res.status(201).json({ label });
  } catch (err) {
    console.error("Create Label Error:", err);
    return res.status(500).json({ error: "Server error while creating label" });
  }
});

// List labels for user
router.get("/", verifyJWT, async (req, res) => {
  try {
    const userUid = req.uid;
    const labels = await Label.find({ userUid }).sort({ createdAt: -1 });
    return res.json({ labels });
  } catch (err) {
    console.error("List Labels Error:", err);
    return res
      .status(500)
      .json({ error: "Server error while fetching labels" });
  }
});

// Get single label
router.get("/:id", verifyJWT, async (req, res) => {
  try {
    const userUid = req.uid;
    const { id } = req.params;
    const label = await Label.findOne({ id, userUid });
    if (!label) return res.status(404).json({ error: "Label not found" });
    return res.json({ label });
  } catch (err) {
    console.error("Get Label Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Update label
router.put("/:id", verifyJWT, async (req, res) => {
  try {
    const userUid = req.uid;
    const { id } = req.params;
    const { name } = req.body;

    const label = await Label.findOne({ id, userUid });
    if (!label) return res.status(404).json({ error: "Label not found" });

    if (name) {
      // avoid duplicate name
      const dup = await Label.findOne({ userUid, name, id: { $ne: id } });
      if (dup)
        return res
          .status(400)
          .json({ error: "another label with this name exists" });
      label.name = name;
      // update denormalized labelName in tasks that use this label
      await Task.updateMany(
        { labelId: label.id, userUid },
        { $set: { labelName: name } }
      );
    }

    await label.save();
    return res.json({ label });
  } catch (err) {
    console.error("Update Label Error:", err);
    return res.status(500).json({ error: "Server error while updating label" });
  }
});

// Delete label
router.delete("/:id", verifyJWT, async (req, res) => {
  try {
    const userUid = req.uid;
    const { id } = req.params;

    const label = await Label.findOneAndDelete({ id, userUid });
    if (!label) return res.status(404).json({ error: "Label not found" });

    // Remove label reference from tasks (set to null + clear labelName)
    await Task.updateMany(
      { labelId: label.id, userUid },
      { $set: { labelId: null, labelName: "" } }
    );

    return res.json({ message: "Label deleted", label });
  } catch (err) {
    console.error("Delete Label Error:", err);
    return res.status(500).json({ error: "Server error while deleting label" });
  }
});

module.exports = router;
