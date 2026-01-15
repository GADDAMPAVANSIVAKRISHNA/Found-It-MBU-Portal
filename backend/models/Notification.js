const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['lost_report', 'found_report', 'claim_submitted', 'claim_status', 'item_status', 'connection_request', 'connection_accepted', 'connection_rejected', 'new_message'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  itemId: { type: String },
  claimId: { type: String },
  actionUrl: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Post-save hook: emit real-time event when a new notification is created
try {
  const notificationHub = require('../utils/notificationHub');

  notificationSchema.post('save', function(doc) {
    // Only emit for newly created notifications
    try {
      if (notificationHub && notificationHub.isReady()) {
        notificationHub.emitToUser(doc.userId, 'notifications:new', doc);
        notificationHub.emitUnreadCount(doc.userId);
      }
    } catch (e) {
      console.error('Notification post-save emit error:', e && e.message);
    }
  });
} catch (e) {
  console.warn('Notification hook setup failed:', e && e.message);
}

module.exports = mongoose.model('Notification', notificationSchema);