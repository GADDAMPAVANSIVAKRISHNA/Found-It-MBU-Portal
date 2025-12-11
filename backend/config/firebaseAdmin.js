
const admin = require('firebase-admin');

function parseServiceAccount() {
  const raw = process.env.FIREBASE_ADMIN_KEY || process.env.FIREBASE_ADMIN_JSON;
  if (raw) {
    try {
      const normalized = raw.replace(/\\n/g, '\n');
      return JSON.parse(normalized);
    } catch (_) {}
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }
  return null;
}

if (!admin.apps.length) {
  const svc = parseServiceAccount();
  if (svc) {
    try {
      admin.initializeApp({ credential: admin.credential.cert(svc) });
      console.log('✅ Firebase admin initialized');
    } catch (err) {
      console.error('❌ Firebase admin init error:', err && err.message ? err.message : err);
    }
  } else {
    console.warn('⚠️ Firebase admin not configured. Set FIREBASE_ADMIN_KEY or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY');
  }
}

module.exports = admin;


