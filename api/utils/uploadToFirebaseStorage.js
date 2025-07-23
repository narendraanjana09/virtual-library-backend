const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const os = require("os");
const fs = require("fs");

const bucket = admin.storage().bucket();

async function uploadFileToStorage(file, folder, customFileName = null) {
  const tempFilePath = path.join(os.tmpdir(), file.originalname);
  fs.writeFileSync(tempFilePath, file.buffer);
  const fileName = customFileName || file.originalname;

  const storageFileName = `${folder}/${fileName}`;
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

  const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${
    bucket.name
  }/o/${encodeURIComponent(storageFileName)}?alt=media&token=${
    uploadOptions.metadata.metadata.firebaseStorageDownloadTokens
  }`;

  return downloadURL;
}

async function deleteFromFirebaseStorage(publicUrl) {
  try {
    const decodedUrl = decodeURIComponent(publicUrl);
    const match = decodedUrl.match(/\/o\/(.*?)\?alt=/);

    if (!match || !match[1]) {
      console.warn(
        "Invalid Firebase Storage URL. Could not extract file path."
      );
      return;
    }

    const filePath = match[1];
    await bucket.file(filePath).delete();
    console.log(`Deleted from Firebase: ${filePath}`);
  } catch (err) {
    console.error("❌ Failed to delete file from Firebase:", err.message);
  }
}

module.exports = {
  uploadFileToStorage,
  deleteFromFirebaseStorage,
};
