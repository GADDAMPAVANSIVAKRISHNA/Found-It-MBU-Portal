const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Build transporter for Gmail SMTP (recommended config)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Optional: verify SMTP on startup
async function isEmailConfigured() {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
}

// Send verification email
async function sendVerificationEmail(email, link) {
  await transporter.sendMail({
    from: `"Found-It" <${EMAIL_USER}>`,
    to: email,
    subject: 'Verify your email',
    html: `
      <p>Hello,</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${link}">Verify Email</a></p>
      <p>If you did not request this, please ignore this email.</p>
      <br />
      <p>– Found-It Team</p>
    `,
  });
}

// Send password reset email
async function sendPasswordResetEmail(email, link) {
  await transporter.sendMail({
    from: `"Found-It" <${EMAIL_USER}>`,
    to: email,
    subject: 'Reset your password',
    html: `
      <p>Hello,</p>
      <p>You requested to reset your password.</p>
      <p>Click the link below to reset it:</p>
      <p><a href="${link}">Reset Password</a></p>
      <p>If you did not request this, please ignore this email.</p>
      <br />
      <p>– Found-It Team</p>
    `,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  isEmailConfigured,
};
