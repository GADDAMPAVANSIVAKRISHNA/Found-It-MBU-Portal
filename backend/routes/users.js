const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');

// 🔹 REGISTER USER ( Internal / Post-Firebase )
router.post('/register', async (req, res) => {
  try {
    const { name, email, branch, year, contactNumber, gender, password } = req.body;

    // Validate domain
    if (!email || !/@mbu\.asia$/.test(email)) {
      return res.status(400).json({ error: 'Valid @mbu.asia email required' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create new user
    user = new User({
      name: name || email.split('@')[0],
      email,
      mbuEmail: email,
      password: password || Math.random().toString(36).slice(2), // Use provided password or random
      branch: branch || 'NA',
      year: year || 'NA',
      contactNumber: contactNumber || '',
      gender: gender || '',
      role: 'student',
      isVerified: false // Wait for Firebase verification
    });

    await user.save();

    return res.json({
      success: true,
      message: "User profile created",
      user: { id: user._id, email: user.email }
    });

  } catch (error) {
    console.error("Register API Error:", error);
    res.status(500).json({ error: error.message });
  }
});


// 🔹 GET USER BY EMAIL
router.get('/by-email', auth, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email query required' });

    // Security check: ensure requesting user matches query email or is admin
    // req.user is populated by auth middleware
    if (req.user.email !== email && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

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

// 🔹 UPDATE USER PROFILE
router.put('/me', auth, async (req, res) => {
  try {
    const { name, branch, year, gender, contactNumber } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update fields if provided
    if (name) user.name = name;
    if (branch) user.branch = branch;
    if (year) user.year = year;
    if (gender) user.gender = gender;
    if (contactNumber) user.contactNumber = contactNumber;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        contactNumber: user.contactNumber,
        gender: user.gender,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
