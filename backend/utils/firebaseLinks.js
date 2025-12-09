const admin = require('../config/firebaseAdmin');
const CLIENT_URL = process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';

const actionCodeSettings = {
  url: `${CLIENT_URL}/login`,
  handleCodeInApp: false,  // IMPORTANT for web apps
};

async function generateVerificationLink(email) {
  return admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
}

async function generateResetLink(email) {
  return admin.auth().generatePasswordResetLink(email, actionCodeSettings);
}

module.exports = {
  generateVerificationLink,
  generateResetLink,
};
