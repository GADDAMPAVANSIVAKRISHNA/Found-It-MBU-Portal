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
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, default: '' },
  contactNumber: { type: String, required: true },
  rollNumber: { type: String, default: '' },
  category: { type: String, required: true },
  subcategory: { type: String },
  imageUrl: { type: String },
  userId: { type: String },
  userName: { type: String },
  userEmail: { type: String },
  userContact: { type: String },
  whereKept: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Claimed', 'Returned', 'Unclaimed'], default: 'Unclaimed' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  badge: { type: String, default: null },
  confirmedBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
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
