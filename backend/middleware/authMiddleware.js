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
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid Firebase token', details: error && error.message ? error.message : error });
  }
};
