// // backend/config/firebaseAdmin.js
// // CommonJS-friendly Firebase Admin initializer with graceful fallback.
// const admin = require('firebase-admin');

// let adminInstance = null;

// try {
//   const raw = process.env.FIREBASE_ADMIN_KEY;
//   if (raw) {
//     // Clean up key: remove surrounding quotes if present (common in .env)
//     let cleanRaw = raw.trim();
//     if (cleanRaw.startsWith('"') && cleanRaw.endsWith('"')) {
//       cleanRaw = cleanRaw.slice(1, -1);
//     }

//     // Fix newlines: convert literal \n to real newlines
//     const normalized = cleanRaw.replace(/\\n/g, '\n');

//     let serviceAccount;
//     try {
//       serviceAccount = JSON.parse(normalized);
//     } catch (e1) {
//       // Fallback: handle real newlines
//       const fixed = cleanRaw.replace(/\n/g, '\\n').replace(/\r/g, '');
//       serviceAccount = JSON.parse(fixed);
//     }

//     if (!admin.apps.length) {
//       admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount),
//       });
//     }
//     adminInstance = admin;
//     console.log('✅ Firebase admin initialized');
//   } else {
//     console.warn('⚠️ FIREBASE_ADMIN_KEY not set; Firebase admin will be disabled');
//   }
// } catch (err) {
//   console.warn('⚠️ Failed to initialize Firebase admin:', err && err.message ? err.message : err);
//   // Leave adminInstance as null; callers should handle absence
// }

// module.exports = adminInstance;


// backend/firebaseAdmin.js
const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin initialized 🔥");
  } catch (err) {
    console.error("Firebase Admin init error:", err.message);
  }
}

module.exports = admin;
