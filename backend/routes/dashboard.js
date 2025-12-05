const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');

// GET /api/dashboard (protected)
// Returns user stats and their items
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user profile
    const user = await User.findById(userId).select('-password -verificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get counts
    const lostCount = await LostItem.countDocuments({
      userId,
      approvalStatus: { $ne: 'removed' }
    });

    const foundCount = await FoundItem.countDocuments({
      userId,
      approvalStatus: { $ne: 'removed' }
    });

    // Get user's lost and found items
    const [myLostItems, myFoundItems] = await Promise.all([
      LostItem.find({
        userId,
        approvalStatus: { $ne: 'removed' }
      })
        .sort({ createdAt: -1 })
        .lean(),
      FoundItem.find({
        userId,
        approvalStatus: { $ne: 'removed' }
      })
        .sort({ createdAt: -1 })
        .lean()
    ]);

    return res.json({
      success: true,
      stats: {
        lost: lostCount,
        found: foundCount
      },
      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        contactNumber: user.contactNumber,
        gender: user.gender,
        role: user.isAdmin ? 'admin' : 'student'
      },
      myLostItems,
      myFoundItems
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
