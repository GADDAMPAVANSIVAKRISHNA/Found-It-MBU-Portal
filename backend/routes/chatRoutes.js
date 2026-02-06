const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const User = require('../models/user');
const FoundItem = require('../models/foundItem');
const LostItem = require('../models/lostItem');

// Helper to parse item ID and get model
const parseItemId = (rawId) => {
  if (rawId.startsWith('found_')) {
    return { id: rawId.replace('found_', ''), model: 'FoundItem' };
  } else if (rawId.startsWith('lost_')) {
    return { id: rawId.replace('lost_', ''), model: 'LostItem' };
  }
  // Fallback if no prefix (legacy or direct ID) - assume FoundItem or check both?
  // For safety, let's assume FoundItem if unknown, or try to find in both. 
  // But mostly frontend sends prefixed ID from /gallery.
  return { id: rawId, model: 'FoundItem' };
};

// POST /api/chats - Create or find chat
router.post('/', auth, async (req, res) => {
  try {
    let { itemId, ownerId, itemType, ownerEmail } = req.body;

    // Fallback: If no ownerId but we have an email, try to find the user
    if (!ownerId && ownerEmail) {
      const ownerUser = await User.findOne({ email: ownerEmail });
      if (ownerUser) {
        ownerId = ownerUser._id.toString();
      }
    }

    if (!itemId || !ownerId) {
      // If still missing after lookup attempt
      return res.status(400).json({ error: 'Missing itemId or ownerId (and email lookup failed)' });
    }

    if (ownerId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot connect with yourself' });
    }

    // Determine model and real ID
    let realItemId = itemId;
    let itemModel = 'FoundItem';

    // 1. Try explicit itemType if provided
    if (itemType) {
      if (itemType === 'Found' || itemType === 'FoundItem') itemModel = 'FoundItem';
      else if (itemType === 'Lost' || itemType === 'LostItem') itemModel = 'LostItem';

      // Clean prefix if present
      realItemId = itemId.replace(/^(found_|lost_)/, '');
    } else {
      // 2. Fallback to prefix parsing
      const parsed = parseItemId(itemId);
      realItemId = parsed.id;
      itemModel = parsed.model;
    }

    // Verify item exists
    let ItemModel = itemModel === 'FoundItem' ? FoundItem : LostItem;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(realItemId)) {
      return res.status(400).json({ error: 'Invalid Item ID format' });
    }

    let itemExists = await ItemModel.findById(realItemId);

    if (!itemExists) {
      // Fallback: Try the other model
      const OtherModel = itemModel === 'FoundItem' ? LostItem : FoundItem;
      const otherItem = await OtherModel.findById(realItemId);

      if (otherItem) {
        itemExists = otherItem;
        itemModel = itemModel === 'FoundItem' ? 'LostItem' : 'FoundItem';
      }
    }

    if (!itemExists) {
      return res.status(404).json({ error: `Item not found (ID: ${realItemId})` });
    }

    // Check if chat exists
    // Participants array contains both users. Order doesn't matter for $all.
    const existingChat = await Chat.findOne({
      item: realItemId,
      itemModel: itemModel,
      participants: { $all: [req.user._id, ownerId] }
    })
      .populate('participants', 'name email')
      .populate({ path: 'item', model: itemModel }); // Dynamic populate

    if (existingChat) {
      return res.json({ chat: existingChat });
    }

    // Create new chat
    const newChat = new Chat({
      item: realItemId,
      itemModel: itemModel,
      participants: [req.user._id, ownerId]
    });

    await newChat.save();

    // Populate before returning
    await newChat.populate('participants', 'name email');
    // await newChat.populate({ path: 'item', model: itemModel });

    res.status(201).json({ chat: newChat });

  } catch (err) {
    console.error('Create chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chats - Fetch user chats
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name email')
      .sort({ updatedAt: -1 });

    // Manually populate item because of dynamic refPath (or let Mongoose handle it if schema is correct)
    // Since schema has refPath: 'itemModel', Mongoose should handle populate('item') automatically if itemModel is set.
    await Chat.populate(chats, { path: 'item' });
    // Note: If itemModel is 'FoundItem', it looks up 'FoundItem' model.

    res.json({ chats });
  } catch (err) {
    console.error('Fetch chats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chats/:chatId - Fetch single chat details
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', 'name email');

    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // Check participation
    const isParticipant = chat.participants.some(p => p._id.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ error: 'Forbidden' });

    await chat.populate('item');

    res.json({ chat });
  } catch (err) {
    console.error('Fetch chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
