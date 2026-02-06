const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "neb2700818@smtp-brevo.com",
    pass: process.env.BREVO_SMTP_KEY,
  },
});

async function sendVerificationEmail(email, link) {
  return transporter.sendMail({
    // from: '"FoundIt MBU" <neb2700818@smtp-brevo.com>', // ✅ CHANGED
    from: '"FoundIt MBU" <foundit.mbu@gmail.com>',
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

async function sendPasswordResetEmail(email, link) {
  return transporter.sendMail({
    //from: '"FoundIt MBU" <neb2700818@smtp-brevo.com>', // ✅ CHANGED
    from: '"FoundIt MBU" <foundit.mbu@gmail.com>',
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

async function sendNotificationEmail(email, subject, htmlContent) {
  return transporter.sendMail({
    //from: '"FoundIt MBU" <neb2700818@smtp-brevo.com>', // ✅ CHANGED
    from: '"FoundIt MBU" <foundit.mbu@gmail.com>',
    to: email,
    subject: subject,
    html: htmlContent,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};