const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
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

// Basic text index stays
itemSchema.index({ title: 'text', description: 'text' });

// Pre-validation for gibberish prevention
itemSchema.pre('validate', function(next) {
  if (this.title) {
    const t = this.title.trim();
    const hasAlpha = /[a-zA-Z]/.test(t);
    if (!hasAlpha || t.length < 3) return next(new Error('Invalid title'));
  }
  if (this.description) {
    if (this.description.trim().length < 10) return next(new Error('Description too short'));
  }
  next();
});

itemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Item', itemSchema);
