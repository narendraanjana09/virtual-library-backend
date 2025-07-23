const mongoose = require("mongoose");

const whatsappGroupSchema = new mongoose.Schema({
  index: { type: Number, default: 0 },
  groupName: { type: String, default: "" },
  groupPhotoUrl: { type: String, default: "" },
  groupInvitationLink: { type: String, default: "" },
});

const WhatsAppGroup = mongoose.model("WhatsAppGroup", whatsappGroupSchema);
module.exports = {
  WhatsAppGroup,
  whatsappGroupSchema,
};
