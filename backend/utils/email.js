const nodemailer = require("nodemailer");

/**
 * Brevo SMTP configuration
 * NOTE:
 * - user MUST be "apikey"
 * - pass MUST be BREVO_SMTP_KEY
 */

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: "apikey",
    pass: process.env.BREVO_SMTP_KEY,
  },
});

/**
 * Optional: Check SMTP readiness (NON-BLOCKING)
 */
async function isEmailConfigured() {
  try {
    await transporter.verify();
    console.log("✅ Brevo email service is ready");
    return true;
  } catch (error) {
    console.error("❌ Brevo email service error:", error.message);
    return false;
  }
}

/**
 * Send verification email
 */
async function sendVerificationEmail(email, link) {
  return transporter.sendMail({
    from: '"FoundIt MBU" <no-reply@founditmbu.site>',
    to: email,
    subject: "Verify your FoundIt account",
    html: `
      <p>Hello,</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${link}">Verify Email</a></p>
      <p>If you did not request this, please ignore this email.</p>
      <br />
      <p>– FoundIt Team</p>
    `,
  });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, link) {
  return transporter.sendMail({
    from: '"FoundIt MBU" <no-reply@founditmbu.site>',
    to: email,
    subject: "Reset your FoundIt password",
    html: `
      <p>Hello,</p>
      <p>You requested to reset your password.</p>
      <p>Click the link below to reset it:</p>
      <p><a href="${link}">Reset Password</a></p>
      <p>If you did not request this, please ignore this email.</p>
      <br />
      <p>– FoundIt Team</p>
    `,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  isEmailConfigured,
};
