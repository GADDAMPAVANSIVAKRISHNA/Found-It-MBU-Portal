const admin = require("../config/firebaseAdmin");

/**
 * Frontend URL priority:
 * 1. CLIENT_URL
 * 2. FRONTEND_URL
 * 3. CORS_ORIGIN
 * 4. localhost fallback
 */
const CLIENT_URL =
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  process.env.CORS_ORIGIN ||
  "http://localhost:5173";

/**
 * Firebase action code settings
 */
const actionCodeSettings = {
  url: `${CLIENT_URL}/verify-email`,
  handleCodeInApp: false,
};

/**
 * Generate email verification link
 */
async function generateVerificationLink(email) {
  if (!admin) {
    throw new Error("Firebase Admin not initialized");
  }

  return admin.auth().generateEmailVerificationLink(
    email,
    actionCodeSettings
  );
}

/**
 * Generate password reset link
 */
async function generateResetLink(email) {
  if (!admin) {
    throw new Error("Firebase Admin not initialized");
  }

  return admin.auth().generatePasswordResetLink(
    email,
    actionCodeSettings
  );
}

module.exports = {
  generateVerificationLink,
  generateResetLink,
};
