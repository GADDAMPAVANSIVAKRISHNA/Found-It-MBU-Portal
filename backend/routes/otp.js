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

    // ---------------------------------------------------------
    // ALWAYS Log OTP to console (for Dev/Render Logs access)
    // ---------------------------------------------------------
    console.log("=================================================");
    console.log(`[Generated OTP]: ${otpCode} for ${email}`);
    console.log("=================================================");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.office365.com",
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER || process.env.MAIL_USER,
        pass: process.env.EMAIL_PASS || process.env.MAIL_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // Fail after 10 seconds if no connection
      greetingTimeout: 5000     // Fail if server doesn't say hello
    });

    // ---------------------------------------------------------
    // NON-BLOCKING Email Send
    // Fire and forget (Handle errors in background)
    // ---------------------------------------------------------
    transporter.sendMail({
      to: email,
      subject: "Your OTP Code - MBU Portal",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2 style="color: #333;">Mohan Babu University</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${otpCode}</h1>
          <p>Valid for 5 minutes.</p>
        </div>
      `,
    }).catch(err => {
      console.error("❌ Background Email Warning: Failed to send OTP email.");
      console.error(err.message);
      console.log(`💡 Use the fallback OTP from logs: ${otpCode}`);
    });

    // ---------------------------------------------------------
    // Return Success IMMEDIATELY to Frontend
    // ---------------------------------------------------------
    return res.json({
      success: true,
      message: "OTP sent to registered mail. Please check your inbox."
    });

  } catch (error) {
    console.error("OTP Route Error:", error);
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
