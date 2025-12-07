// const nodemailer = require('nodemailer');

// const defaultHost = 'smtp.office365.com';
// const defaultPort = 587;
// const defaultSecure = false;

// const transporter = nodemailer.createTransport({
//   service: process.env.EMAIL_SERVICE || undefined,
//   host: process.env.SMTP_HOST || defaultHost,
//   port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : defaultPort,
//   secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : defaultSecure,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// async function isEmailConfigured() {
//   try {
//     await transporter.verify();
//     return true;
//   } catch (e) {
//     console.warn('⚠️ Email not fully configured:', e.message);
//     return false;
//   }
// }

// const sendVerificationEmail = async (email, token) => {
//   const url = `${process.env.CLIENT_URL}/verify-email/${token}`;
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Verify Your Found-It Account',
//     html: `<h2>Welcome to Found-It!</h2><p>Click to verify: <a href="${url}">${url}</a></p>`
//   });
// };

// const sendPasswordResetEmail = async (email, token) => {
//   const url = `${process.env.CLIENT_URL}/reset-password/${token}`;
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Reset Your Password',
//     html: `<h2>Password Reset</h2><p>Click to reset: <a href="${url}">${url}</a></p>`
//   });
// };

// module.exports = { sendVerificationEmail, sendPasswordResetEmail };

// const sendVerificationOtpEmail = async (email, otp) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Your Found-It Verification Code',
//     html: `<h2>Verify your Found-It account</h2><p>Your OTP code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`
//   });
// };

// module.exports.sendVerificationOtpEmail = sendVerificationOtpEmail;
// module.exports.isEmailConfigured = isEmailConfigured;

// const sendItemReportEmail = async (email, item) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: `Item Report Received — ${item.title}`,
//     html: `<p>Your ${item.category} (${item.subcategory || ''}) report was received.</p><p>Status: <strong>${item.approvalStatus}</strong> (shown after approval).</p>`
//   });
// };

// const sendClaimSubmittedEmail = async (email, claim) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Claim Submitted — Found-It',
//     html: `<p>Your claim for item <strong>${claim.itemId}</strong> has been submitted.</p><p>Status: <strong>${claim.status}</strong>.</p>`
//   });
// };

// const sendClaimStatusEmail = async (email, claim) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Claim Status Update — Found-It',
//     html: `<p>Your claim status changed to <strong>${claim.status}</strong> for item <strong>${claim.itemId}</strong>.</p>`
//   });
// };

// module.exports.sendItemReportEmail = sendItemReportEmail;
// module.exports.sendClaimSubmittedEmail = sendClaimSubmittedEmail;
// module.exports.sendClaimStatusEmail = sendClaimStatusEmail;


const nodemailer = require("nodemailer");

// PURE OUTLOOK SMTP — Official Azure setup
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
});

// Verify SMTP works
async function isEmailConfigured() {
  try {
    await transporter.verify();
    return true;
  } catch (e) {
    console.warn("⚠️ Email not fully configured:", e.message);
    return false;
  }
}

// Send OTP
async function sendVerificationOtpEmail(email, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Found-It OTP",
    html: `
      <h2>Your OTP Code</h2>
      <p>Your verification code is:</p>
      <h3>${otp}</h3>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}

module.exports = {
  sendVerificationOtpEmail,
  isEmailConfigured,
};
