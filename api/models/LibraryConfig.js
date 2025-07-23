const mongoose = require("mongoose");

const { whatsappGroupSchema } = require("./WhatsAppGroup"); // ✅ import schema, not model

const libraryConfigSchema = new mongoose.Schema({
  currentLiveClassUrl: { type: String, default: "" },
  heroImageUrl: { type: String, default: "" },
  whatsappGroups: { type: [whatsappGroupSchema], default: [] },
  adminAccessEmails: { type: [String], default: [] },
});

const LibraryConfig = mongoose.model("LibraryConfig", libraryConfigSchema);
module.exports = LibraryConfig;
