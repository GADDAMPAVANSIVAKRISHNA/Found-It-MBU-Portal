const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');

// Get current user profile (protected)
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

// Get user profile by id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -verificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update current user profile (protected)
router.put('/me', auth, async (req, res) => {
  try {
    const { name, branch, year, contactNumber, gender } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (branch !== undefined) updates.branch = branch;
    if (year !== undefined) updates.year = year;
    if (contactNumber !== undefined) updates.contactNumber = contactNumber;
    if (gender !== undefined) updates.gender = gender;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password -verificationToken -resetPasswordToken');
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

// Update user profile
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { name, branch, year, contactNumber, gender } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, branch, year, contactNumber, gender },
      { new: true }
    ).select('-password -verificationToken -resetPasswordToken');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upsert user by email (for Firebase auth flow)
router.post('/upsert-by-email', async (req, res) => {
  try {
    const { name, email, branch, year, contactNumber, gender, role } = req.body;
    if (!email || !/@mbu\.asia$/.test(email)) {
      return res.status(400).json({ error: 'Valid @mbu.asia email required' });
    }
    let user = await User.findOne({ email });
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
        role: role === 'admin' ? 'admin' : 'student',
        isVerified: true
      });
      await user.save();
    } else {
      user.name = name || user.name;
      user.branch = branch || user.branch;
      user.year = year || user.year;
      user.contactNumber = contactNumber || user.contactNumber;
      if (gender !== undefined) user.gender = gender || user.gender;
      if (role) user.role = role;
      user.isVerified = true;
      await user.save();
    }
    res.json({
      success: true, user: {
        id: user._id,
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

// Register user (alias for upsert-by-email to match user request)
router.post('/register', async (req, res) => {
  try {
    const { name, email, branch, year, contactNumber, gender } = req.body;

    // Validate email
    if (!email || !/@mbu\.asia$/.test(email)) {
      return res.status(400).json({ error: 'Valid @mbu.asia email required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        name: name || email.split('@')[0],
        email,
        mbuEmail: email,
        password: Math.random().toString(36).slice(2), // Random password since we use Firebase
        branch: branch || 'NA',
        year: year || 'NA',
        contactNumber: contactNumber || '',
        gender: gender || '',
        role: 'student',
        isVerified: true
      });
      await user.save();
    } else {
      // User exists - we can optionally update or just return success
      // User requested: "If the user already exists in MongoDB, do not create again — instead continue normally."
      // We will just return the existing user without updating, to be safe, or maybe update fields if they are empty?
      // Let's stick to the requested behavior: "continue normally".
      // We won't update the user if they exist, just return success.
    }

    res.json({
      success: true,
      user: {
        id: user._id,
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
    console.error("Register API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by email
router.get('/by-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email query required' });
    const user = await User.findOne({ email }).select('-password -verificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile (name, branch, year, contactNumber)
router.patch('/:id', async (req, res) => {
  try {
    const { name, branch, year, contactNumber, gender } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (branch !== undefined) updates.branch = branch;
    if (year !== undefined) updates.year = year;
    if (contactNumber !== undefined) updates.contactNumber = contactNumber;
    if (gender !== undefined) updates.gender = gender;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
