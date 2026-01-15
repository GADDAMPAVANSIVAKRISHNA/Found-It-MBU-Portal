const mongoose = require('mongoose');

const PromptResponseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  itemId: { type: String, required: true },
  actionType: { type: String, required: true }, // e.g., 'confirm_return' | 'confirm_receipt'
  response: { type: String, required: true }, // 'dismissed' | 'dont_ask_again' | 'confirmed'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PromptResponse', PromptResponseSchema);
