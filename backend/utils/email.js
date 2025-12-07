const nodemailer = require("nodemailer");

// Outlook SMTP using PORT 25 for Render free tier
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 25,
  secure: false, // no TLS on 25
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// verify SMTP connectivity
async function isEmailConfigured() {
  try {
    await transporter.verify();
    return true;
  } catch (e) {
    console.warn("⚠️ Email not fully configured:", e.message);
    return false;
  }
}

// SEND OTP EMAIL
async function sendVerificationOtpEmail(email, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Found-It OTP Code",
    html: `
      <h2>Hello!</h2>
      <p>Your One-Time Password is:</p>
      <h2 style="color:#2b5acf">${otp}</h2>
      <p>This code will expire in 10 minutes.</p>
      <br/>
      <p>— Found-It Verification Team</p>
    `,
  });
}

// EXPORT
module.exports = {
  sendVerificationOtpEmail,
  isEmailConfigured,
};
