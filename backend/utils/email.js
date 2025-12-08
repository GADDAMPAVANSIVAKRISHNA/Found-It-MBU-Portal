const nodemailer = require("nodemailer");

// Outlook SMTP using PORT 587 (STARTTLS)
// Port 25 is often blocked on cloud providers like Render
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000
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



// PASSWORD RESET EMAIL
async function sendPasswordResetEmail(email, token) {
  // Simple link for now, can be improved
  const resetLink = `https://found-it-mbu.onrender.com/reset-password/${token}`; // Adjust domain as needed

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Password - MBU Portal",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't ask for this, ignore this email.</p>
      </div>
    `
  });
}

// EXPORT
module.exports = {

  sendPasswordResetEmail,
  isEmailConfigured,
};
