const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // e.g. 'gmail'
  host: process.env.SMTP_HOST, // e.g. 'smtp.office365.com'
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email/${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Found-It Account',
    html: `<h2>Welcome to Found-It!</h2><p>Click to verify: <a href="${url}">${url}</a></p>`
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Password',
    html: `<h2>Password Reset</h2><p>Click to reset: <a href="${url}">${url}</a></p>`
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
 
const sendVerificationOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Found-It Verification Code',
    html: `<h2>Verify your Found-It account</h2><p>Your OTP code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`
  });
};

module.exports.sendVerificationOtpEmail = sendVerificationOtpEmail;
