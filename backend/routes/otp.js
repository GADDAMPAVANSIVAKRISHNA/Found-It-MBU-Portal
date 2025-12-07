const express = require("express");
const router = express.Router();
const Otp = require("../models/otp");
const User = require("../models/user");
const nodemailer = require("nodemailer");

// ===============================
//  Send OTP
// ===============================
router.post("/send", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const otpCode = Math.floor(1000 + Math.random() * 9000); // 4 digits
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // delete previous OTP
    await Otp.findOneAndDelete({ email });

    await Otp.create({
      email,
      otp: otpCode,
      expiresAt
    });

    // Debug: Log what we are using (mask password)
    console.log("OTP Email Config:", {
      host: process.env.SMTP_HOST || "smtp.office365.com",
      port: process.env.SMTP_PORT || 587,
      user: process.env.EMAIL_USER || process.env.MAIL_USER,
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.office365.com",
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true", // false for 587 usually
      auth: {
        user: process.env.EMAIL_USER || process.env.MAIL_USER,
        pass: process.env.EMAIL_PASS || process.env.MAIL_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false // Helps with some self-signed cert issues or strict firewalls
      }
    });

    try {
      await transporter.sendMail({
        to: email,
        subject: "Your OTP Code",
        html: `
          <h2>Your OTP Code:</h2>
          <h1>${otpCode}</h1>
          <p>Valid for only 5 minutes.</p>
        `,
      });
      return res.json({ success: true, message: "OTP sent to registered mail. Please check your inbox." });
    } catch (emailError) {
      console.error("Error sending email:", emailError.message);

      // FALLBACK FOR DEV/DEMO: If email fails (e.g. auth disabled), log OTP to console
      // so the user can still proceed with verification.
      console.log("=================================================");
      console.log(`FALLBACK OTP (Use this to verify): ${otpCode}`);
      console.log("=================================================");

      return res.json({
        success: true,
        message: "OTP sent (Email delivery failed: check server console for code)"
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


// ===============================
//  Verify OTP
// ===============================
// ===============================
//  Verify OTP
// ===============================
router.post("/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email });
    if (!record) return res.json({ success: false, message: "OTP not found" });

    if (record.otp.toString() !== otp.toString()) {
      return res.json({ success: false, message: "Wrong OTP" });
    }

    if (Date.now() > record.expiresAt) {
      await Otp.deleteOne({ email });
      return res.json({ success: false, message: "OTP expired" });
    }

    // ------------------------------------------
    // FIX: Update User status to verified
    // ------------------------------------------
    const user = await User.findOne({ email });
    if (user) {
      user.isVerified = true;
      user.verificationOtp = undefined; // Clear any old auth-based OTPs
      user.verificationOtpExpires = undefined;
      await user.save();
    }
    // ------------------------------------------

    // delete after success
    await Otp.deleteOne({ email });

    return res.json({ success: true, message: "OTP verified" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


module.exports = router;
