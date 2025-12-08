// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { 
//     type: String, 
//     required: true, 
//     unique: true,
//     match: /@mbu\.asia$/ 
//   },
//     mbuEmail: { type: String, required: true, unique: true },
//   password: { type: String, required: true, minlength: 6 },
//   branch: { type: String, required: true },
//   year: { type: String, required: true },
//   contactNumber: { type: String, required: true },
//   gender: { type: String, enum: ['male', 'female'], default: '' },
//   role: { type: String, enum: ['admin', 'student'], default: 'student' },
//   isVerified: { type: Boolean, default: false },
//   verificationToken: String,
//   verificationTokenExpires: Date,
//   verificationOtp: String,
//   verificationOtpExpires: Date,
//   resetPasswordToken: String,
//   resetPasswordExpires: Date,
//   createdAt: { type: Date, default: Date.now }
// });

// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// userSchema.methods.comparePassword = async function(password) {
//   return await bcrypt.compare(password, this.password);
// };

// module.exports = mongoose.model('User', userSchema);


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true }, // added
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /@mbu\.asia$/
  },
  mbuEmail: { type: String },

  // password not strictly required for Firebase users
  password: { type: String, minlength: 6 },

  branch: { type: String, required: true },
  year: { type: String, required: true },
  contactNumber: { type: String, required: true },
  gender: { type: String },

  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },

  createdAt: { type: Date, default: Date.now }
});

// Hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
