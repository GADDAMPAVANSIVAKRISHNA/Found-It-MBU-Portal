const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const firebaseAuth = require('../middleware/firebaseAuth');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const ClaimRequest = require('../models/ClaimRequest');
const Notification = require('../models/Notification');
const { sendItemReportEmail } = require('../utils/email');

router.get('/items/lost', firebaseAuth, isAdmin, async (_req, res) => {
  try {
    const items = await LostItem.find().sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/items/found', firebaseAuth, isAdmin, async (_req, res) => {
  try {
    const items = await FoundItem.find().sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/claims', firebaseAuth, isAdmin, async (_req, res) => {
  try {
    const claims = await ClaimRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/item/:id/status', firebaseAuth, isAdmin, async (req, res) => {
  try {
    const { collection, status } = req.body; // collection: 'lost' | 'found'
    if (collection === 'lost') {
      const item = await LostItem.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!item) return res.status(404).json({ error: 'Item not found' });
      try {
        await Notification.create({
          userId: item.userId,
          type: 'item_status',
          title: 'Item status updated',
          message: `Your lost item status changed to ${status}.`,
          itemId: item._id.toString()
        });
      } catch (_) {}
      return res.json({ success: true, item });
    } else {
      const item = await FoundItem.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!item) return res.status(404).json({ error: 'Item not found' });
      try {
        await Notification.create({
          userId: item.userId,
          type: 'item_status',
          title: 'Item status updated',
          message: `Your found item status changed to ${status}.`,
          itemId: item._id.toString()
        });
      } catch (_) {}
      return res.json({ success: true, item });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/claim/:id/status', firebaseAuth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body; // approved | rejected | pending
    const claim = await ClaimRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/item/:id/approval', firebaseAuth, isAdmin, async (req, res) => {
  try {
    const { collection, approvalStatus } = req.body; // pending | approved | rejected
    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }
    const Model = collection === 'lost' ? LostItem : FoundItem;
    const item = await Model.findByIdAndUpdate(req.params.id, { approvalStatus }, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    try {
      await Notification.create({
        userId: item.userId,
        type: 'item_status',
        title: 'Item approval updated',
        message: `Your item is ${approvalStatus}.`,
        itemId: item._id.toString()
      });
      await sendItemReportEmail(item.userEmail, item);
    } catch (_) {}
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
