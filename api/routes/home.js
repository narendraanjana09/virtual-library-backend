const express = require("express");
const router = express.Router();
const upload = require("multer")(); // Handles multipart/form-data
const verifyJWT = require("../middleware/verifyJWT");
const User = require("../models/User");
const LibraryConfig = require("../models/LibraryConfig");
const WhatsAppGroup = require("../models/WhatsAppGroup");
const {
  uploadFileToStorage,
  deleteFromFirebaseStorage,
} = require("../utils/uploadToFirebaseStorage");

async function getConfig() {
  let cfg = await LibraryConfig.findOne();
  if (!cfg) cfg = await LibraryConfig.create({});
  return cfg;
}

router.get("/connect", verifyJWT, async (req, res) => {
  try {
    const uid = req.uid;
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let config = await LibraryConfig.findOne();
    if (!config) {
      config = await LibraryConfig.create({});
    }
    const allowedExams = ["FMGE", "NEET PG", "INICT"];
    const configData = config.toObject();

    if (!allowedExams.includes(user.exam)) {
      configData.whatsappGroups = [];
    }
    const isAdmin = config.adminAccessEmails.includes(user.email);
    return res.json({
      user: user,
      libraryConfig: configData,
      isAdmin: isAdmin,
    });
  } catch (err) {
    console.error("Connect Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/config/live-class", verifyJWT, async (req, res) => {
  const { currentLiveClassUrl } = req.body;
  if (!currentLiveClassUrl) {
    return res.status(400).json({ error: "currentLiveClassUrl is required" });
  }
  const cfg = await getConfig();
  cfg.currentLiveClassUrl = currentLiveClassUrl;
  await cfg.save();
  res.json({ message: "Live class URL updated", config: cfg });
});

router.put(
  "/config/hero-image",
  verifyJWT,
  upload.single("heroImage"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "heroImage file is required" });
    }
    const imageUrl = await uploadFileToStorage(
      req.file,
      "appData",
      "heroImage"
    );

    const cfg = await getConfig();
    cfg.heroImageUrl = imageUrl;
    await cfg.save();

    res.json({ message: "Hero image updated", heroImageUrl: imageUrl });
  }
);

router.post(
  "/config/whatsapp-group",
  verifyJWT,
  upload.single("groupPhoto"), // Expect file field named `groupPhoto`
  async (req, res) => {
    try {
      const { groupName, groupInvitationLink } = req.body;

      // Validate required fields
      if (!groupName || !groupInvitationLink || !req.file) {
        return res
          .status(400)
          .json({ error: "Missing group name, link, or group photo" });
      }

      const cfg = await getConfig();

      // Upload file to Firebase
      const photoUrl = await uploadFileToStorage(
        req.file,
        "whatsapp-groups",
        null // filename is optional, use original
      );

      const newGroup = {
        index: cfg.whatsappGroups.length,
        groupName,
        groupPhotoUrl: photoUrl,
        groupInvitationLink,
      };

      cfg.whatsappGroups.push(newGroup);
      await cfg.save();

      res.json({ message: "Group added", whatsappGroups: cfg.whatsappGroups });
    } catch (err) {
      console.error("Add WhatsApp Group Error:", err);
      res.status(500).json({ error: `Server error ${err}` });
    }
  }
);

router.delete("/config/whatsapp-group", verifyJWT, async (req, res) => {
  try {
    const groupIdToDelete = req.body.groupId;
    if (!groupIdToDelete) {
      return res.status(400).json({ error: "Group ID is required" });
    }

    const cfg = await getConfig();
    const groupIndex = cfg.whatsappGroups.findIndex(
      (g) => g._id === groupIdToDelete
    );

    if (groupIndex === -1) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = cfg.whatsappGroups[groupIndex];

    // Delete group photo from Firebase
    if (group.groupPhotoUrl) {
      await deleteFromFirebaseStorage(group.groupPhotoUrl);
    }

    // Remove from array
    cfg.whatsappGroups.splice(groupIndex, 1);
    await cfg.save();

    res.json({ message: "Group deleted", whatsappGroups: cfg.whatsappGroups });
  } catch (err) {
    console.error("Delete WhatsApp Group Error:", err);
    res.status(500).json({ error: "Server error while deleting group" });
  }
});

// Add Admin Email
router.post("/config/admin-email", verifyJWT, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const cfg = await getConfig();
  if (!cfg.adminAccessEmails.includes(email)) {
    cfg.adminAccessEmails.push(email);
    await cfg.save();
  }

  res.json({
    message: "Admin email added",
    adminAccessEmails: cfg.adminAccessEmails,
  });
});

// Delete Admin Email
router.delete("/config/admin-email", verifyJWT, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const cfg = await getConfig();
  cfg.adminAccessEmails = cfg.adminAccessEmails.filter((e) => e !== email);
  await cfg.save();

  res.json({
    message: "Admin email removed",
    adminAccessEmails: cfg.adminAccessEmails,
  });
});

module.exports = router;
