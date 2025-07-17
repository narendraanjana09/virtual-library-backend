// api/firebase.js
const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'virtual-library-4b732.firebasestorage.app'
});

module.exports = admin;
