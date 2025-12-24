const admin = require('../config/firebaseAdmin');
const CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';

const actionCodeSettings = {
  url: `${CLIENT_URL}/verify-email`,
  handleCodeInApp: false,
};

async function generateVerificationLink(email) {
  if (!admin) throw new Error('Firebase Admin not initialized');
  return admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
}

async function generateResetLink(email) {
  if (!admin) throw new Error('Firebase Admin not initialized');
  return admin.auth().generatePasswordResetLink(email, actionCodeSettings);
}

module.exports = {
  generateVerificationLink,
  generateResetLink,
};

