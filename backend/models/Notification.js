const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['lost_report', 'found_report', 'claim_submitted', 'claim_status', 'item_status', 'connection_request', 'connection_accepted', 'connection_rejected', 'new_message'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  itemId: { type: String },
  claimId: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);