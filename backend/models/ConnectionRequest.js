const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
    finderId: { type: String, required: true }, // User ID of the person who found the item
    claimantId: { type: String, required: true }, // User ID of the person claiming the item
    itemId: { type: String, required: true }, // ID of the Found Item
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'blocked'],
        default: 'pending'
    },
    verification: {
        color: { type: String, required: true },
        mark: { type: String, required: true },
        location: { type: String, required: true }
    },
    messages: [{
        senderId: { type: String, required: true },
        text: { type: String, required: true }, // Template message content
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);
