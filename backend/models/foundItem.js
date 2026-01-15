// const mongoose = require('mongoose');

// const foundItemSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   location: { type: String, required: true },
//   date: { type: Date, required: true },
//   contactNumber: { type: String, required: true },
//   category: { type: String, required: true },
//   imageUrl: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('FoundItem', foundItemSchema);

const mongoose = require('mongoose');

const FoundItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  location: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  time: { type: String, default: '' },
  contactNumber: { type: String, required: true, trim: true },
  rollNumber: { type: String, default: '' },
  category: { type: String, required: true },
  subcategory: { type: String },
  imageUrl: { type: String },
  userId: { type: String },
  userName: { type: String },
  userEmail: { type: String },
  userContact: { type: String },
  whereKept: { type: String, default: '' },
  // New canonical statuses: Unclaimed, Claimed, Verified, Returned, Expired, Under Review
  // We keep legacy values in enum temporarily to avoid validation errors during migration
  status: { type: String, enum: ['Unclaimed','Claimed','Verified','Returned','Expired','Under Review','Active','Frozen'], default: 'Unclaimed' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'removed'], default: 'pending' },
  badge: { type: String, default: null },
  confirmedBy: { type: String, default: null },
  claimedBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Simple content check: disallow obviously gibberish titles like 'asdf', 'gdf', short repeated characters
FoundItemSchema.pre('validate', function(next) {
  if (this.title) {
    const t = this.title.trim();
    const hasAlpha = /[a-zA-Z]/.test(t);
    if (!hasAlpha || t.length < 3) {
      return next(new Error('Invalid title'));
    }
  }
  if (this.description) {
    const d = this.description.trim();
    if (d.length < 10) return next(new Error('Description too short'));
  }
  next();
});

// Virtual for populating user details
FoundItemSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

FoundItemSchema.set('toObject', { virtuals: true });
FoundItemSchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model('FoundItem', FoundItemSchema);
