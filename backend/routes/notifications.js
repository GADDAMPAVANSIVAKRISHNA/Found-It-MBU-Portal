const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

router.get('/notifications/unread', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const notes = await Notification.find({ userId, read: false }).sort({ createdAt: -1 });
    res.json({ success: true, notifications: notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications/:id/read', async (req, res) => {
  try {
    const note = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!note) return res.status(404).json({ error: 'Notification not found' });
    res.json({ success: true, notification: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;