const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const os = require("os");
const fs = require("fs");

const bucket = admin.storage().bucket();

async function uploadFileToStorage(file) {
  const tempFilePath = path.join(os.tmpdir(), file.originalname);
  fs.writeFileSync(tempFilePath, file.buffer);

  const storageFileName = `profilePhotos/${Date.now()}_${file.originalname}`;
  const uploadOptions = {
    destination: storageFileName,
    metadata: {
      contentType: file.mimetype,
      metadata: {
        firebaseStorageDownloadTokens: uuidv4(), // Needed for public access URL
      },
    },
  };

  await bucket.upload(tempFilePath, uploadOptions);

  fs.unlinkSync(tempFilePath); // Clean up temp file

  const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    storageFileName
  )}?alt=media&token=${uploadOptions.metadata.metadata.firebaseStorageDownloadTokens}`;

  return downloadURL;
}

module.exports = uploadFileToStorage;
