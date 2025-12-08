// //const admin = require("firebase-admin");
// const admin = require("../firebase"); 
// const User = require("../models/user");
// const jwt = require("jsonwebtoken");

// // ==============================
// // INITIALIZE FIREBASE ADMIN
// // ==============================
// if (!admin.apps.length) {
//   try {
//     admin.initializeApp({
//       credential: admin.credential.cert(
//         JSON.parse(process.env.FIREBASE_ADMIN_KEY)
//       ),
//     });
//     console.log("🔥 Firebase Admin Initialized");
//   } catch (err) {
//     console.error("❌ Firebase Admin Init Failed:", err.message);
//   }
// }

// module.exports = async (req, res, next) => {
//   try {
//     const header = req.headers.authorization;

//     if (!header || !header.startsWith("Bearer ")) {
//       return res.status(401).json({ error: "Missing token" });
//     }

//     const token = header.split(" ")[1];

//     // ==============================
//     // 1) Try Firebase Token First
//     // ==============================
//     try {
//       const decoded = await admin.auth().verifyIdToken(token);

//       let user = await User.findOne({ firebaseUid: decoded.uid });

//       if (!user) {
//         // Try find by email
//         user = await User.findOne({ email: decoded.email });

//         if (user) {
//           user.firebaseUid = decoded.uid;
//           await user.save();
//         } else {
//           // NEW USER (auto-create)
//           user = await User.create({
//             firebaseUid: decoded.uid,
//             name: decoded.name || decoded.email.split("@")[0],
//             email: decoded.email,
//             mbuEmail: decoded.email,
//             branch: "Not set",
//             year: "Not set",
//             gender: "Not set",
//             contactNumber: "Not set",
//             password: Math.random().toString(36).slice(-10),
//             isVerified: true,
//           });
//         }
//       }

//       req.user = user;
//       req.userId = user._id.toString();

//       return next();
//     } catch (err) {
//       console.log("❌ Firebase token failed, trying JWT:", err.message);
//     }

//     // ==============================
//     // 2) Fallback: Backend JWT (optional)
//     // ==============================
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.userId);
//       if (!user) throw new Error("User not found");

//       req.user = user;
//       req.userId = user._id.toString();
//       return next();
//     } catch (e) {
//       return res.status(401).json({ error: "Invalid or expired token" });
//     }

//   } catch (error) {
//     return res.status(401).json({ error: "Authentication failed" });
//   }
// };


const admin = require("../firebase");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

// Firebase Admin is already initialized in ../firebase.js
// We just use the instance.

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.split(" ")[1];

    // 1️⃣ Try Firebase ID Token First
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      let user = await User.findOne({ firebaseUid: decoded.uid });

      if (!user) {
        // Try email match
        user = await User.findOne({ email: decoded.email });

        if (user) {
          user.firebaseUid = decoded.uid;
          // Sync verification status if Firebase says verified
          if (decoded.email_verified && !user.isVerified) {
            user.isVerified = true;
          }
          await user.save();
        } else {
          // Auto-create new user
          user = await User.create({
            firebaseUid: decoded.uid,
            name: decoded.name || decoded.email.split("@")[0],
            email: decoded.email,
            mbuEmail: decoded.email,
            branch: "Not set",
            year: "Not set",
            gender: "Not set",
            contactNumber: "Not set",
            password: Math.random().toString(36).slice(-10),
            isVerified: decoded.email_verified || false,
          });
        }
      } else {
        // User found by UID, check if we need to sync verification
        if (decoded.email_verified && !user.isVerified) {
          user.isVerified = true;
          await user.save();
        }
      }

      req.user = user;
      req.userId = user._id.toString();

      return next();
    } catch (e) {
      console.log("❌ Firebase token failed. Trying JWT...");
    }

    // 2️⃣ Backend JWT Fallback
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) throw new Error("User not found");

      req.user = user;
      req.userId = user._id.toString();

      return next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

  } catch (err) {
    return res.status(401).json({ error: "Authentication failed" });
  }
};
