const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const admin = require("../config/firebaseAdmin");

const {
  generateVerificationLink,
  generateResetLink,
} = require("../utils/firebaseLinks");

const {
  sendVerificationEmail,
  sendPasswordResetEmail: sendResetEmail,
} = require("../utils/email");

/**
 * REGISTER (Firebase + Mongo + Email Verification)
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, branch, year, contactNumber } = req.body;

    if (!email.endsWith("@mbu.asia")) {
      return res.status(400).json({ error: "Must use @mbu.asia email" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 1️⃣ Create Firebase Auth user
    const fbUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // 2️⃣ Create Mongo user + verification link in parallel
    const [user, link] = await Promise.all([
      User.create({
        name,
        email,
        password,
        branch,
        year,
        contactNumber,
        firebaseUid: fbUser.uid,
        isVerified: false,
      }),
      generateVerificationLink(email),
    ]);

    // 3️⃣ Respond IMMEDIATELY (no waiting for email)
    res.status(201).json({
      message: "Registered successfully. Check your email to verify.",
    });

    // 4️⃣ Send verification email asynchronously
    sendVerificationEmail(email, link).catch((err) => {
      console.error("❌ VERIFICATION EMAIL FAILED:", err.message);
    });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Auto-sync verification from Firebase
    if (!user.isVerified) {
      try {
        const fbUser = await admin.auth().getUserByEmail(email);
        if (fbUser.emailVerified) {
          user.isVerified = true;
          await user.save();
        }
      } catch (_) {}
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: "Verify email first" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * RESEND VERIFICATION EMAIL
 */
router.post("/send-verification", async (req, res) => {
  try {
    const { email } = req.body;

    const link = await generateVerificationLink(email);

    res.json({ message: "Verification email resent" });

    sendVerificationEmail(email, link).catch((err) => {
      console.error("❌ RESEND VERIFICATION ERROR:", err.message);
    });
  } catch (err) {
    console.error("❌ VERIFICATION ERROR:", err);
    res.status(500).json({ error: "Email send failed" });
  }
});

/**
 * PASSWORD RESET
 */
router.post("/send-password-reset", async (req, res) => {
  try {
    const { email } = req.body;

    const link = await generateResetLink(email);

    res.json({ message: "Password reset email sent" });

    sendResetEmail(email, link).catch((err) => {
      console.error("❌ PASSWORD RESET ERROR:", err.message);
    });
  } catch (err) {
    console.error("❌ PASSWORD RESET ERROR:", err);
    res.status(500).json({ error: "Email send failed" });
  }
});

module.exports = router;
