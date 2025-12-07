const express = require('express');
const router = express.Router();
const User = require('../models/user');
const OTP = require('../models/otp');
const auth = require('../middleware/auth');
const { sendVerificationOtpEmail } = require('../utils/email');

// 🔹 REGISTER USER + SEND OTP
router.post('/register', async (req, res) => {
  try {
    const { name, email, branch, year, contactNumber, gender } = req.body;

    // Validate domain
    if (!email || !/@mbu\.asia$/.test(email)) {
      return res.status(400).json({ error: 'Valid @mbu.asia email required' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    // Create new user if not exists
    if (!user) {
      user = new User({
        name: name || email.split('@')[0],
        email,
        mbuEmail: email,
        password: Math.random().toString(36).slice(2),
        branch: branch || 'NA',
        year: year || 'NA',
        contactNumber: contactNumber || '',
        gender: gender || '',
        role: 'student',
        isVerified: false // IMPORTANT
      });

      await user.save();
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Store OTP in DB
    await OTP.create({ email, otp });

    // Send email
    await sendVerificationOtpEmail(email, otp);

    return res.json({
      success: true,
      message: "OTP sent to email",
      user: { id: user._id, email: user.email }
    });

  } catch (error) {
    console.error("Register API Error:", error);
    res.status(500).json({ error: error.message });
  }
});


// 🔹 GET USER BY EMAIL
router.get('/by-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email query required' });

    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 CURRENT USER PROFILE
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      branch: user.branch,
      year: user.year,
      contactNumber: user.contactNumber,
      gender: user.gender,
      role: user.role
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
