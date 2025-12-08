const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const { sendPasswordResetEmail, isEmailConfigured } = require('../utils/email');
const auth = require('../middleware/auth');
const https = require('https');
const admin = require('../config/firebaseAdmin');
const jwksClient = require('jwks-rsa');

// quick test inside auth router
router.get('/test', (req, res) => {
  res.json({ ok: true, message: 'Auth router test working!' });
});

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branch, year, contactNumber } = req.body;

    // Validate email domain
    if (!email.endsWith('@mbu.asia')) {
      return res.status(400).json({ error: 'Must use @mbu.asia email' });
    }

    // Check if user already exists
    let existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User exists' });
    }

    // Create user with initial status (Not Verified)
    // We rely on Firebase Client SDK to send the verification email.
    const user = new User({
      name,
      email,
      password,
      branch,
      year,
      contactNumber,
      isVerified: false
    });

    await user.save();

    res.status(201).json({
      message: 'User registered. Please check email for verification.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is verified (Sync with Firebase)
    if (!user.isVerified) {
      let isActuallyVerified = false;

      // Try to check with Firebase Admin if available
      if (admin) {
        try {
          const fbUser = await admin.auth().getUserByEmail(email);
          if (fbUser.emailVerified) {
            isActuallyVerified = true;
            user.isVerified = true;
            await user.save();
          }
        } catch (fbErr) {
          console.warn("Could not fetch Firebase status:", fbErr.message);
        }
      }

      if (!isActuallyVerified) {
        return res.status(403).json({ error: 'Please verify your email before logging in.' });
      }
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET USER PROFILE
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -verificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      branch: user.branch,
      year: user.year,
      contactNumber: user.contactNumber,
      gender: user.gender,
      role: user.isAdmin ? 'admin' : 'student'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE PROFILE (protected)
router.put('/me', auth, async (req, res) => {
  try {
    const { name, branch, year, contactNumber } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (branch) updates.branch = branch;
    if (year) updates.year = year;
    if (contactNumber) updates.contactNumber = contactNumber;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        contactNumber: user.contactNumber
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    let emailSent = false;
    try {
      const ok = await isEmailConfigured();
      if (ok) {
        await sendPasswordResetEmail(email, resetToken);
        emailSent = true;
      }
    } catch (e) {
      console.warn('⚠️  Failed to send password reset email:', e.message);
    }

    res.json({
      message: emailSent ? 'Reset link sent to email' : 'Email service unavailable. Contact admin.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RESET PASSWORD
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;