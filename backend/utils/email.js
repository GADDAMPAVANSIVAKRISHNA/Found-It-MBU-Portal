const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function isEmailConfigured() {
  try {
    await transporter.verify();
    return true;
  } catch (e) {
    return false;
  }
}

async function sendVerificationEmail(email, link) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
      html: `<p>Please verify your email address by clicking the link below:</p><p><a href="${link}">Verify Email</a></p>`,
    });
  } catch (err) {
    throw err;
  }
}

async function sendPasswordResetEmail(email, link) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your password',
      html: `<p>Click the link below to reset your password:</p><p><a href="${link}">Reset Password</a></p>`,
    });
  } catch (err) {
    throw err;
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  isEmailConfigured,
};

