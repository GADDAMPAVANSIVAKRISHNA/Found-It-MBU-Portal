// backend/middleware/authMiddleware.js
// CommonJS version that uses backend/config/firebaseAdmin.js and gracefully handles disabled firebase admin.
const admin = require('../config/firebaseAdmin');

module.exports.verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = header.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!admin) {
      // Firebase admin not configured; reject politely or allow for JWT fallback elsewhere
      return res.status(503).json({ error: 'Firebase auth not configured on server' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // contains uid, email, etc.

    // Check if user exists in MongoDB and is email verified
    const User = require('../models/user');
    try {
      const user = await User.findOne({ email: decoded.email });
      if (!user || !user.isVerified) {
        return res.status(403).json({
          error: 'Email not verified. Please verify your email before accessing the app.'
        });
      }
      req.user = decoded;
      return next();
    } catch (err) {
      console.error('User lookup error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid Firebase token', details: error && error.message ? error.message : error });
  }
};
module.exports.protect = module.exports.verifyToken;
