const express = require('express');
const router = express.Router();
const FoundItem = require('../models/foundItem');
const LostItem = require('../models/lostItem');
const User = require('../models/user');
const ClaimRequest = require('../models/ClaimRequest');

// Simple in-memory cache
let cache = null;
let cacheTs = 0;
const TTL = 20 * 1000; // 20s cache

async function computeStats() {
  const [foundCount, lostCount, returnedFound, returnedLost, users, activeClaims] = await Promise.all([
    FoundItem.countDocuments({ approvalStatus: { $ne: 'removed' } }),
    LostItem.countDocuments({ approvalStatus: { $ne: 'removed' } }),
    FoundItem.countDocuments({ status: 'Returned' }),
    // Lost items use 'Resolved' to indicate owner got it back
    LostItem.countDocuments({ status: 'Resolved' }),
    User.countDocuments({}),
    ClaimRequest.countDocuments({ status: { $in: ['pending', 'approved'] } })
  ]);

  return {
    totalItems: foundCount + lostCount,
    returnedItems: returnedFound + returnedLost,
    users,
    activeClaims
  };
}

router.get('/', async (req, res) => {
  try {
    if (cache && Date.now() - cacheTs < TTL) {
      return res.json({ success: true, stats: cache });
    }
    cache = await computeStats();
    cacheTs = Date.now();
    return res.json({ success: true, stats: cache });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/total-items', async (req, res) => {
  try {
    const s = await computeStats();
    return res.json({ success: true, total: s.totalItems });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/returned-items', async (req, res) => {
  try {
    const s = await computeStats();
    return res.json({ success: true, total: s.returnedItems });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/registered-users', async (req, res) => {
  try {
    const s = await computeStats();
    return res.json({ success: true, total: s.users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/active-claims', async (req, res) => {
  try {
    const s = await computeStats();
    return res.json({ success: true, total: s.activeClaims });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;