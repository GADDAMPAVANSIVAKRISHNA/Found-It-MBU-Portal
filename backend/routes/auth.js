const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const { sendVerificationEmail, sendPasswordResetEmail, sendVerificationOtpEmail, isEmailConfigured } = require('../utils/email');
const auth = require('../middleware/auth');
const https = require('https');
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
    
    // Generate OTP for email verification
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    // Create user with initial status
    const user = new User({
      name,
      email,
      password,
      branch,
      year,
      contactNumber,
      verificationOtp: otp,
      verificationOtpExpires: otpExpires,
      isVerified: false
    });
    
    await user.save();
    
    // Send verification email with OTP
    let emailSent = false;
    try {
      const ok = await isEmailConfigured();
      if (ok) {
        await sendVerificationOtpEmail(email, otp);
        emailSent = true;
      }
    } catch (e) {
      console.warn('⚠️  Failed to send OTP email:', e.message);
    }
    
    res.status(201).json({
      message: emailSent ? 'OTP sent to email. Verify to activate account.' : 'Account created. Email service not available',
      hint: emailSent ? undefined : 'Enter the OTP below on the verification page.',
      otp: emailSent ? undefined : otp
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VERIFY OTP - Email verification
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check OTP validity
    if (user.verificationOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    if (new Date() > user.verificationOtpExpires) {
      return res.status(400).json({ error: 'OTP expired' });
    }
    
    // Mark user as verified
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();
    
    res.json({ message: 'Email verified successfully. You can now login.' });
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
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email first' });
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

// RESEND VERIFICATION EMAIL
router.post('/resend-verification-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    user.verificationOtp = otp;
    user.verificationOtpExpires = otpExpiry;
    await user.save();

    // Send verification email with new OTP
    try {
      await sendVerificationOtpEmail(email, otp);
      res.status(200).json({ message: 'Verification email sent. Please check your inbox.' });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
    }
  } catch (error) {
    console.error('Error in resend-verification-email:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;