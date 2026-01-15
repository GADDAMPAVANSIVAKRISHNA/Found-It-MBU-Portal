const Notification = require('../models/Notification');

let ioInstance = null;

module.exports = {
  init: (io) => {
    ioInstance = io;
  },

  isReady: () => !!ioInstance,

  // Emit an event to a single user (join rooms by userId in server socket connect)
  emitToUser: async (userId, event, payload) => {
    try {
      if (!ioInstance) return;
      ioInstance.to(String(userId)).emit(event, payload);
    } catch (e) {
      console.error('notificationHub.emitToUser error:', e && e.message);
    }
  },

  // Emit unread count to a user
  emitUnreadCount: async (userId) => {
    try {
      if (!ioInstance) return;
      const count = await Notification.countDocuments({ userId: String(userId), read: false });
      ioInstance.to(String(userId)).emit('notifications:unread_count', { count });
    } catch (e) {
      console.error('notificationHub.emitUnreadCount error:', e && e.message);
    }
  },
};