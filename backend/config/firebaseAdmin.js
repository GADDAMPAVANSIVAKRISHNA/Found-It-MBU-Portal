// backend/config/firebaseAdmin.js
// CommonJS-friendly Firebase Admin initializer with graceful fallback.
const admin = require('firebase-admin');

let adminInstance = null;

try {
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (raw) {
    // Some environments store private key with escaped newlines; fix that
    const normalized = raw.replace(/\\n/g, '\n');
    const serviceAccount = JSON.parse(normalized);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    adminInstance = admin;
    console.log('✅ Firebase admin initialized');
  } else {
    console.warn('⚠️ FIREBASE_ADMIN_KEY not set; Firebase admin will be disabled');
  }
} catch (err) {
  console.warn('⚠️ Failed to initialize Firebase admin:', err && err.message ? err.message : err);
  // Leave adminInstance as null; callers should handle absence
}

module.exports = adminInstance;
