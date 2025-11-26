const mongoose = require('mongoose');

const claimRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  itemType: { type: String, enum: ['lost', 'found'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  studentId: { type: String, required: true },
  contactNumber: { type: String, required: true },
  proofDescription: { type: String, required: true },
  proofImageUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClaimRequest', claimRequestSchema);