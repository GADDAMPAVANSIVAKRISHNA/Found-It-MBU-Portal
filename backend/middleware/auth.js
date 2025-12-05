// const jwt = require('jsonwebtoken');
// const User = require('../models/user');

// module.exports = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
//     if (!token) return res.status(401).json({ error: 'No token' });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId).select('-password');

//     if (!user) return res.status(401).json({ error: 'User not found' });
//     if (!user.isVerified) return res.status(401).json({ error: 'Verify email first' });

//     req.user = user;
//     req.userId = decoded.userId;
//     next();
//   } catch (error) {
//     res.status(401).json({ error: 'Invalid token' });
//   }
// };


const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const User = require('../models/user');

/**
 * Auth middleware:
 * 1) Verifies Firebase ID token (primary)
 * 2) Falls back to old backend JWT (secondary)
 */
module.exports = async (req, res, next) => {
  try {
    const raw = req.header('Authorization');
    const token = raw?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    // ============================
    // 1) Try Firebase Verification
    // ============================
    try {
      if (admin?.auth) {
        const decoded = await admin.auth().verifyIdToken(token);

        let user = await User.findOne({ firebaseUid: decoded.uid });

        // If user doesn't exist by firebaseUid, try to find by email
        if (!user) {
          user = await User.findOne({ email: decoded.email });

          if (user) {
            // Link existing user to Firebase UID
            user.firebaseUid = decoded.uid;
            // Ensure isVerified is true for Firebase authenticated users if you want to trust Firebase
            // user.isVerified = true; 
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              firebaseUid: decoded.uid,
              name: decoded.name || decoded.email.split('@')[0],
              email: decoded.email,
              mbuEmail: decoded.email,
              password: Math.random().toString(36).slice(-12),
              branch: 'Not set',
              year: 'Not set',
              contactNumber: 'Not set',
              isVerified: true
            });
          }
        }

        req.user = user;
        req.userId = user._id.toString();

        if (!user.isVerified) {
          return res.status(403).json({ error: 'Verify email first' });
        }

        return next();
      }
    } catch (firebaseError) {
      // console.log("Firebase auth failed:", firebaseError.message);
    }

    // ============================
    // 2) Fallback to backend JWT
    // ============================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    req.userId = decoded.userId;
    next();

  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
