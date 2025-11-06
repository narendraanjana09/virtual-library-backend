const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Label = require("../models/Label");
const verifyJWT = require("../middleware/verifyJWT");

// Create task
router.post("/", verifyJWT, async (req, res) => {
  try {
    const userUid = req.uid;
    const { topic, labelId, date, completed = false, color = "" } = req.body;

    if (!topic) return res.status(400).json({ error: "topic is required" });

    let labelName = "";
    if (labelId) {
      const label = await Label.findOne({ id: labelId, userUid });
      if (!label)
        return res
          .status(400)
          .json({ error: "label not found or not owned by user" });
      labelName = label.name;
    }

    const task = await Task.create({
      userUid,
      topic,
      labelId: labelId || null,
      labelName,
      date: date || "",
      completed: !!completed,
      color,
    });

    return res.status(201).json({ task });
  } catch (err) {
    console.error("Create Task Error:", err);
    return res.status(500).json({ error: "Server error while creating task" });
  }
});

// List tasks (with optional filters: completed, labelId, fromDate/toDate, search, pagination)
router.get("/", verifyJWT, async (req, res) => {
  try {
    const userUid = req.uid;
    const {
      completed,
      labelId,
      q,
      date,
      fromDate,
      toDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { userUid };

    if (completed !== undefined) {
      filter.completed = completed === "true" || completed === true;
    }
    if (labelId) filter.labelId = labelId;
    if (q) filter.topic = { $regex: q, $options: "i" };

    // --- ✅ NEW: date filtering ---
    if (date) {
      // exact date match
      filter.date = date;
    } else if (fromDate || toDate) {
      // date range (string comparison if stored as "YYYY-MM-DD")
      filter.date = {};
      if (fromDate) filter.date.$gte = fromDate;
      if (toDate) filter.date.$lte = toDate;
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    return res.json({ tasks, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("List Tasks Error:", err);
    return res.status(500).json({ error: "Server error while fetching tasks" });
  }
});

// Get single task
router.get("/:id", verifyJWT, async (req, res) => {
  try {
    const userUid = req.uid;
    const { id } = req.params;
    const task = await Task.findOne({ id, userUid });
    if (!task) return res.status(404).json({ error: "Task not found" });
    return res.json({ task });
  } catch (err) {
    console.error("Get Task Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Update task (partial allowed)
router.put("/:id", verifyJWT, async (req, res) => {
  try {
    const userUid = req.uid;
    const { id } = req.params;
    const updates = req.body || {};

    const task = await Task.findOne({ id, userUid });
    if (!task) return res.status(404).json({ error: "Task not found" });

    // If updating labelId, validate ownership and update labelName
    if (updates.labelId !== undefined) {
      if (updates.labelId === null) {
        task.labelId = null;
        task.labelName = "";
      } else {
        const label = await Label.findOne({ id: updates.labelId, userUid });
        if (!label)
          return res
            .status(400)
            .json({ error: "label not found or not owned by user" });
        task.labelId = label.id;
        task.labelName = label.name;
      }
    }

    if (updates.topic !== undefined) task.topic = updates.topic;
    if (updates.date !== undefined) task.date = updates.date;
    if (updates.completed !== undefined) task.completed = !!updates.completed;
    if (updates.color !== undefined) task.color = updates.color;

    await task.save();
    return res.json({ task });
  } catch (err) {
    console.error("Update Task Error:", err);
    return res.status(500).json({ error: "Server error while updating task" });
  }
});

// Delete task
router.delete("/:id", verifyJWT, async (req, res) => {
  try {
    const userUid = req.uid;
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ id, userUid });
    if (!task) return res.status(404).json({ error: "Task not found" });
    return res.json({ message: "Task deleted", task });
  } catch (err) {
    console.error("Delete Task Error:", err);
    return res.status(500).json({ error: "Server error while deleting task" });
  }
});

module.exports = router;
