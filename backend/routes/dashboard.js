const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');

// ===============================
// FIXED DASHBOARD API (FULLY COMPATIBLE WITH FRONTEND)
// ===============================
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Fetch user profile
    const user = await User.findById(userId).select(
      "-password -verificationToken -resetPasswordToken"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch stats
    const lostCount = await LostItem.countDocuments({
      userId,
      approvalStatus: { $ne: "removed" }
    });

    const foundCount = await FoundItem.countDocuments({
      userId,
      approvalStatus: { $ne: "removed" }
    });

    // Fetch user items
    const [myLostItems, myFoundItems] = await Promise.all([
      LostItem.find({
        userId,
        approvalStatus: { $ne: "removed" }
      })
        .sort({ createdAt: -1 })
        .lean(),

      FoundItem.find({
        userId,
        approvalStatus: { $ne: "removed" }
      })
        .sort({ createdAt: -1 })
        .populate('claimedBy', 'name email contactNumber rollNumber')
        .lean()
    ]);

    // ===============================
    // FINAL RESPONSE (Frontend expects THIS)
    // ===============================
    return res.json({
      profile: {
        _id: user._id,
        name: user.name || "",
        email: user.email || "",
        branch: user.branch || "",
        year: user.year || "",
        contactNumber: user.contactNumber || "",
        gender: user.gender || "",
        role: user.isAdmin ? "admin" : "student"
      },

      stats: {
        lost: lostCount,
        found: foundCount
      },

      myLostItems,
      myFoundItems
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ error: "Dashboard fetch failed" });
  }
});

module.exports = router;
