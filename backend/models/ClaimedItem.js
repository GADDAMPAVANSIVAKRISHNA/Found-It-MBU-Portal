const mongoose = require('mongoose');

const claimedItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  claimerName: { type: String, required: true },
  claimerBranch: { type: String, required: true },
  claimerYear: { type: String, required: true },
  claimerContact: { type: String, required: true },
  claimDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Collected'], default: 'Pending' }
});

module.exports = mongoose.model('ClaimedItem', claimedItemSchema);
