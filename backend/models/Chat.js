const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemModel'
  },
  itemModel: {
    type: String,
    required: true,
    enum: ['FoundItem', 'LostItem']
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique chat per item per pair of users
// We might need a compound index, but the participants array order might vary.
// A better way is to handle uniqueness in controller or ensure sorted participants.
// But for now, let's rely on controller logic to find existing chat.

module.exports = mongoose.model('Chat', ChatSchema);
