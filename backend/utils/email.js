const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email/${token}`;
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Verify Your Found-It Account',
    html: `<h2>Welcome to Found-It!</h2><p>Click to verify: <a href="${url}">${url}</a></p>`
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Reset Your Password',
    html: `<h2>Password Reset</h2><p>Click to reset: <a href="${url}">${url}</a></p>`
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
