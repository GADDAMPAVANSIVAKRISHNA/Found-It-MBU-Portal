const admin = require("firebase-admin");

function parseServiceAccountFromEnv() {
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) return null;

  // Try multiple strategies so we don't crash on different encodings:
  // 1. Raw JSON string in env
  // 2. Base64 encoded JSON
  // 3. Escaped newlines ("{\\n ... }")
  try {
    let cleanRaw = raw.trim();
    if (cleanRaw.startsWith('"') && cleanRaw.endsWith('"')) {
      cleanRaw = cleanRaw.slice(1, -1);
    }

    // Strategy 1: Standard parse
    try {
      return JSON.parse(cleanRaw);
    } catch (e1) {
      // Strategy 2: Replace real newlines with escaped newlines (fixes copy-paste from .env)
      // This handles the "Bad control character" error
      const fixedNewlines = cleanRaw.replace(/\n/g, '\\n').replace(/\r/g, '');
      return JSON.parse(fixedNewlines);
    }
  } catch (err) {
    // try base64
    // try base64
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (err2) {
      // try replacing escaped newlines
      try {
        const replaced = raw.replace(/\\n/g, '\n');
        return JSON.parse(replaced);
      } catch (err3) {
        // give up and return null so caller can provide a helpful message
        return null;
      }
    }
  }
}

if (!admin.apps.length) {
  const serviceAccount = parseServiceAccountFromEnv();

  if (!serviceAccount) {
    // Provide a helpful error without crashing the whole app with an obscure parse error
    console.error('\n[FIREBASE INIT] Could not parse service account from environment variable FIREBASE_ADMIN_KEY.');
    console.error('Please provide the Firebase service account JSON in one of these forms:');
    console.error(' - Raw JSON string (not recommended for production)');
    console.error(' - Base64-encoded JSON (recommended for .env): set FIREBASE_ADMIN_KEY to base64 of the JSON file');
    console.error(' - JSON with escaped newlines (\\n)');
    console.error('\nCurrent value (first 200 chars):', (process.env.FIREBASE_ADMIN_KEY || '').slice(0, 200));
    console.error('\n⚠️  WARNING: Firebase Admin SDK not initialized. Authentication features will not work.');
    console.error('To fix this: Get your Firebase service account key from Firebase Console > Project Settings > Service Accounts');
    console.log('\n✅ Backend will continue running, but Firebase-dependent features will be unavailable.\n');
    // Don't throw - let the app continue without Firebase
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[FIREBASE] ✅ Firebase Admin SDK initialized successfully');
    } catch (initError) {
      console.error('[FIREBASE] ❌ Failed to initialize Firebase:', initError.message);
    }
  }
}

module.exports = admin;
