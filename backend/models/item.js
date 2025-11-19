const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Cards', 'Electronic Devices', 'Books', 'Others']
  },
  subcategory: { type: String, required: true },
  itemType: { 
    type: String, 
    required: true,
    enum: ['Lost', 'Found']
  },
  image: { type: String, default: '' },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  status: { 
    type: String,
    enum: ['Active', 'Claimed', 'Returned'],
    default: 'Active'
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userContact: { type: String, required: true },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

itemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Item', itemSchema);
