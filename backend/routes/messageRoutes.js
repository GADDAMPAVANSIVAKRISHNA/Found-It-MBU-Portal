const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const notificationHub = require('../utils/notificationHub');

// GET /api/messages/:chatId
router.get('/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify chat existence and participation
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const isParticipant = chat.participants.some(p => p.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ error: 'Forbidden' });

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/:chatId
router.post('/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'Message text is required' });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const isParticipant = chat.participants.some(p => p.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ error: 'Forbidden' });

    const newMessage = new Message({
      chat: chatId,
      sender: req.user._id,
      text
    });

    await newMessage.save();

    // Update chat's lastMessage and updatedAt
    chat.lastMessage = newMessage._id;
    chat.updatedAt = Date.now();
    await chat.save();

    await newMessage.populate('sender', 'name email');

    // Real-time notification
    if (notificationHub.isReady()) {
      // Notify all participants (including sender for multi-device sync)
      chat.participants.forEach(pId => {
        notificationHub.emitToUser(pId, 'chat:new_message', {
          chatId,
          message: newMessage
        });
      });
    }

    res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
