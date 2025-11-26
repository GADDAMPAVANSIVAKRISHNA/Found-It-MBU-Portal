// const mongoose = require('mongoose');

// const lostItemSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   location: { type: String, required: true },
//   date: { type: Date, required: true },
//   contactNumber: { type: String, required: true },
//   category: { type: String, required: true },
//   imageUrl: { type: String, default: '' },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('LostItem', lostItemSchema);


const mongoose = require('mongoose');

const LostItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: String, required: true },
  contactNumber: { type: String, required: false, default: '' },
  category: { type: String, required: true },
  subcategory: { type: String },
  imageUrl: { type: String },
  userId: { type: String },
  userName: { type: String },
  userEmail: { type: String },
  userContact: { type: String },
  status: { type: String, enum: ['Active', 'Returned'], default: 'Active' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LostItem', LostItemSchema);
