const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');
const admin = require('../config/firebaseAdmin');

const { generateVerificationLink, generateResetLink } = require('../utils/firebaseLinks');
const { sendVerificationEmail, sendPasswordResetEmail: sendResetEmail } = require('../utils/email');

// REGISTER (Firebase + Mongo + Gmail verification)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branch, year, contactNumber } = req.body;

    if (!email.endsWith('@mbu.asia')) {
      return res.status(400).json({ error: 'Must use @mbu.asia email' });
    }

    // Already exists?
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User already exists' });

    // 1) Create Firebase auth user
    const fbUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // 2) Store in Mongo
    const user = await User.create({
      name,
      email,
      password,
      branch,
      year,
      contactNumber,
      firebaseUid: fbUser.uid,
      isVerified: false,
    });

    // 3) Send Gmail verification link
    const link = await generateVerificationLink(email);
    await sendVerificationEmail(email, link);

    res.status(201).json({
      message: "Registered. Check your @mbu.asia email for verification link.",
    });

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // require verified
    if (!user.isVerified) {
      try {
        const fbUser = await admin.auth().getUserByEmail(email);
        if (fbUser.emailVerified) {
          user.isVerified = true;
          await user.save();
        }
      } catch {}
    }

    if (!user.isVerified)
      return res.status(403).json({ error: 'Please verify email before login' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEND VERIFICATION AGAIN
router.post('/send-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const link = await generateVerificationLink(email);
    await sendVerificationEmail(email, link);

    res.json({ message: "Verification email resent" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PASSWORD RESET
router.post('/send-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    const link = await generateResetLink(email);
    await sendResetEmail(email, link);

    res.json({ message: "Password reset email sent" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
