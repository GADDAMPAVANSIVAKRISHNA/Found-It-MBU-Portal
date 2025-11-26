// backend/config/firebaseAdmin.js
import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
