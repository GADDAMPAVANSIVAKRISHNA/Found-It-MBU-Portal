const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -verificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
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

    const { name, branch, year, contactNumber } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, branch, year, contactNumber },
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
    const { name, email, branch, year, contactNumber, role } = req.body;
    if (!email || !/@mbu\.asia$/.test(email)) {
      return res.status(400).json({ error: 'Valid @mbu.asia email required' });
    }
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: name || email.split('@')[0],
        email,
        password: Math.random().toString(36).slice(2),
        branch: branch || 'NA',
        year: year || 'NA',
        contactNumber: contactNumber || '',
        role: role === 'admin' ? 'admin' : 'student',
        isVerified: true
      });
      await user.save();
    } else {
      user.name = name || user.name;
      user.branch = branch || user.branch;
      user.year = year || user.year;
      user.contactNumber = contactNumber || user.contactNumber;
      if (role) user.role = role;
      user.isVerified = true;
      await user.save();
    }
    res.json({ success: true, user: {
      id: user._id,
      name: user.name,
      email: user.email,
      branch: user.branch,
      year: user.year,
      contactNumber: user.contactNumber,
      role: user.role
    }});
  } catch (error) {
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

module.exports = router;
