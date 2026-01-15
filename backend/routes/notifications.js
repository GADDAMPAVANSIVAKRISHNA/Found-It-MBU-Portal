const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const notificationHub = require('../utils/notificationHub');

// Get recent notifications (paginated)
router.get('/notifications', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments({ userId: req.userId });
    const notes = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.json({ success: true, notifications: notes, meta: { total, page, limit } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread count
router.get('/notifications/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.userId, read: false });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a single notification read (only owner)
router.post('/notifications/:id/read', auth, async (req, res) => {
  try {
    const note = await Notification.findById(req.params.id);
    if (!note || String(note.userId) !== String(req.userId)) return res.status(404).json({ error: 'Notification not found' });
    note.read = true;
    await note.save();

    // Emit unread count update
    try { notificationHub.emitUnreadCount(req.userId); } catch (e) { /* ignore */ }

    res.json({ success: true, notification: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications read for the current user
router.post('/notifications/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { $set: { read: true } });

    // Emit unread count update
    try { notificationHub.emitUnreadCount(req.userId); } catch (e) { /* ignore */ }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TEST: Create a test notification for the current user (helpful for manual testing)
router.post('/notifications/test', auth, async (req, res) => {
  try {
    const { title, message, itemId } = req.body || {};
    const note = await Notification.create({
      userId: req.userId,
      type: 'new_message',
      title: title || 'Test Notification',
      message: message || 'This is a test notification sent from /api/notifications/test',
      itemId: itemId || undefined,
    });

    // hook will emit via post-save
    res.json({ success: true, notification: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;