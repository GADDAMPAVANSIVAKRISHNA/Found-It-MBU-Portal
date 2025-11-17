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

module.exports = router;
