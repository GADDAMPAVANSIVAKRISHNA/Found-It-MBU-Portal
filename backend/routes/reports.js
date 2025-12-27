const express = require('express');
const router = express.Router();
const multer = require('multer');
const mime = require('mime-types');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const upload = multer({ storage: multer.memoryStorage() });

// Test endpoint
router.get('/test', (req, res) => {
  console.log('✅ Report routes are loaded');
  res.json({ success: true, message: 'Report routes are working' });
});

// POST /api/report-lost
router.post('/report-lost', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('✅ [REPORT-LOST] Endpoint reached');
    console.log('📝 Body:', req.body);
    console.log('📷 File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

    const { title, description, location, date, contactNumber, category, subcategory } = req.body;
    const userId = req.userId;
    const userName = req.user?.name || req.header('x-user-name') || '';
    const userEmail = req.user?.email || req.header('x-user-email') || '';
    let imageUrl = '';

    // For now, store base64-encoded image in imageUrl field if provided
    if (req.file) {
      // Convert to base64 for storage in MongoDB (small images only)
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype || mime.lookup(req.file.originalname) || 'image/jpeg';
      imageUrl = `data:${mimeType};base64,${base64}`;
    }

    const doc = new LostItem({
      title,
      description,
      location,
      date,
      contactNumber,
      category,
      subcategory,
      imageUrl,
      userId,
      userName,
      userEmail,
      userContact: contactNumber,
      approvalStatus: 'pending',
      status: 'Active'
    });
    await doc.save();

    console.log('✅ Lost item saved:', doc._id);
    return res.status(201).json({ success: true, item: doc, message: 'Lost item reported successfully!' });
  } catch (error) {
    console.error('🔥 [REPORT-LOST] Error:', error.stack || error);
    return res.status(500).json({ success: false, message: 'Error reporting item', error: error.message });
  }
});

// POST /api/report-found
router.post('/report-found', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('✅ [REPORT-FOUND] Endpoint reached');
    console.log('📝 Body:', req.body);
    console.log('📷 File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image required for found items' });
    }

    const { title, description, location, date, contactNumber, category, subcategory } = req.body;
    const userId = req.userId;
    const userName = req.user?.name || req.header('x-user-name') || '';
    const userEmail = req.user?.email || req.header('x-user-email') || '';
    let imageUrl = '';

    if (req.file) {
      // Convert to base64 for storage in MongoDB (small images only)
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype || mime.lookup(req.file.originalname) || 'image/jpeg';
      imageUrl = `data:${mimeType};base64,${base64}`;
    }

    const doc = new FoundItem({
      title,
      description,
      location,
      date,
      contactNumber,
      category,
      subcategory,
      imageUrl,
      userId,
      userName,
      userEmail,
      userContact: contactNumber,
      approvalStatus: 'pending',
      status: 'Active'
    });
    await doc.save();

    console.log('✅ Found item saved:', doc._id);
    return res.status(201).json({ success: true, item: doc, message: 'Found item reported successfully!' });
  } catch (error) {
    console.error('🔥 [REPORT-FOUND] Error:', error.stack || error);
    return res.status(500).json({ success: false, message: 'Error reporting item', error: error.message });
  }
});

// GET /api/items/lost
router.get('/items/lost', async (_req, res) => {
  try {
    const items = await LostItem.find().sort({ createdAt: -1 });
    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error loading lost items', error: error.message });
  }
});

// GET /api/items/found
router.get('/items/found', async (_req, res) => {
  try {
    const items = await FoundItem.find().sort({ createdAt: -1 });
    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error loading found items', error: error.message });
  }
});

module.exports = router;
async function buildImageUrl(file) {
  if (!file) return '';
  const base64 = file.buffer.toString('base64');
  const mimeType = file.mimetype || mime.lookup(file.originalname) || 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

// NEW: POST /api/lost
const admin = require('../firebase');

async function maybeAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (header) {
      const token = header.replace('Bearer ', '');
      // 1. Try Firebase
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        // Find user by firebaseUid or email
        let user = await User.findOne({ firebaseUid: decoded.uid });
        if (!user) user = await User.findOne({ email: decoded.email });
        if (user) {
          req.user = user;
          req.userId = user._id.toString();
          return next();
        }
      } catch (e) {
        // console.log('maybeAuth: Firebase check failed', e.message);
      }

      // 2. Try simple JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          req.user = user;
          req.userId = user._id.toString();
        }
      } catch (e) { }
    }
  } catch (_) {/* ignore */ }
  next();
}

router.post('/lost', maybeAuth, upload.single('image'), async (req, res) => {
  try {
    const imageUrl = await buildImageUrl(req.file);
    const {
      title, description, category, subcategory, location, approximateLocation,
      date, dateLost, time, approximateTime, contactNumber, email, whereKept, rollNumber
    } = req.body;
    const doc = new LostItem({
      title,
      description,
      category,
      subcategory,
      location: location || approximateLocation || '',
      date: dateLost || date || new Date().toISOString().slice(0, 10),
      time: approximateTime || time || '',
      contactNumber,
      rollNumber: rollNumber || '',
      contactPreference: req.body.contactPreference || '',
      imageUrl,
      userId: req.userId,
      userName: req.user?.name || '',
      userEmail: email || req.user?.email || '',
      userContact: contactNumber,
      whereKept: whereKept || '',
      approvalStatus: 'pending',
      status: 'Active'
    });
    await doc.save();
    return res.status(201).json({ success: true, item: doc, message: 'Lost item reported successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// NEW: POST /api/found
router.post('/found', maybeAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image required for found items' });
    const imageUrl = await buildImageUrl(req.file);
    const {
      title, description, category, subcategory, location,
      date, time, contactNumber, email, whereKept, rollNumber
    } = req.body;
    const doc = new FoundItem({
      title,
      description,
      category,
      subcategory,
      location,
      date: date || new Date().toISOString().slice(0, 10),
      time: time || '',
      contactNumber,
      rollNumber: rollNumber || '',
      imageUrl,
      userId: req.userId,
      userName: req.user?.name || '',
      userEmail: email || req.user?.email || '',
      userContact: contactNumber,
      whereKept: whereKept || '',
      approvalStatus: 'pending',
      status: 'Active'
    });
    await doc.save();
    return res.status(201).json({ success: true, item: doc, message: 'Found item reported successfully. Students can now view this item in the Gallery.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// NEW: GET /api/items  (merged lost+found)
router.get('/items', async (req, res) => {
  try {
    const { category, status, q, page = 1, limit = 20, startDate, endDate } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const common = {};
    if (category) common.category = category;
    if (status) common.status = status;
    if (q) common.$or = [{ title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];
    const dateQuery = {};
    if (startDate) dateQuery.createdAt = { ...(dateQuery.createdAt || {}), $gte: new Date(startDate) };
    if (endDate) dateQuery.createdAt = { ...(dateQuery.createdAt || {}), $lte: new Date(endDate) };

    const [lostDocs, foundDocs] = await Promise.all([
      LostItem.find({ ...common, ...dateQuery }).populate('user', 'email').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      FoundItem.find({ ...common, ...dateQuery }).populate('user', 'email').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    ]);

    const mapLost = lostDocs.map(i => ({
      _id: `lost_${i._id.toString()}`,
      id: `lost_${i._id.toString()}`,
      itemType: 'Lost',
      title: i.title,
      description: i.description,
      category: i.category,
      location: i.location,
      date: i.date,
      imageUrl: i.imageUrl || '',
      status: i.status || 'Active',
      userName: i.userName || '',
      userContact: i.userContact || '',
      userEmail: (i.user && i.user.email) ? i.user.email : (i.userEmail || ''),
      userEmail: (i.user && i.user.email) ? i.user.email : (i.userEmail || ''),
      rollNumber: i.rollNumber || '',
      createdAt: i.createdAt,
    }));

    const mapFound = foundDocs.map(i => ({
      _id: `found_${i._id.toString()}`,
      id: `found_${i._id.toString()}`,
      itemType: 'Found',
      title: i.title,
      description: i.description,
      category: i.category,
      location: i.location,
      date: i.date,
      imageUrl: i.imageUrl || '',
      status: i.status || 'Active',
      userName: i.userName || '',
      userContact: i.userContact || '',
      userEmail: (i.user && i.user.email) ? i.user.email : (i.userEmail || ''),
      userEmail: (i.user && i.user.email) ? i.user.email : (i.userEmail || ''),
      rollNumber: i.rollNumber || '',
      createdAt: i.createdAt,
    }));

    const combined = [...mapLost, ...mapFound].sort((a, b) => b.createdAt - a.createdAt);
    const total = combined.length;
    const pagedItems = combined.slice(0, limitNum); // already paged per collection; keep simple paging

    return res.json({ success: true, items: pagedItems, total, page: pageNum, totalPages: Math.ceil(total / limitNum) || 1 });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// NEW: GET /api/items/:id
router.get('/items/:id', async (req, res) => {
  try {
    const [prefix, id] = (req.params.id || '').split('_');
    let doc = null;
    if (prefix === 'lost') doc = await LostItem.findById(id).lean();
    else if (prefix === 'found') doc = await FoundItem.findById(id).lean();
    else doc = await LostItem.findById(req.params.id).lean() || await FoundItem.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Item not found' });
    return res.json({ success: true, item: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// NEW: GET /api/user/items
router.get('/user/items', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const [lost, found] = await Promise.all([
      LostItem.find({ userId }).sort({ createdAt: -1 }).lean(),
      FoundItem.find({ userId }).sort({ createdAt: -1 }).lean(),
    ]);
    return res.json({ success: true, lost, found });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// NEW: GET /api/user/stats
router.get('/user/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const [lostCount, foundCount] = await Promise.all([
      LostItem.countDocuments({ userId }),
      FoundItem.countDocuments({ userId }),
    ]);
    // Items returned/claimed require more logic; approximate via status
    const [claimedCount, returnedCount] = await Promise.all([
      FoundItem.countDocuments({ userId, status: 'Claimed' }),
      FoundItem.countDocuments({ userId, status: 'Returned' }),
    ]);
    return res.json({
      success: true, stats: {
        lostItemsReported: lostCount,
        foundItemsReported: foundCount,
        claimedItems: claimedCount,
        itemsReturned: returnedCount,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});



// // backend/routes/reports.js
// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const mime = require('mime-types');
// const jwt = require('jsonwebtoken');

// const LostItem = require('../models/lostItem');
// const FoundItem = require('../models/foundItem');
// const User = require('../models/user');
// const auth = require('../middleware/auth');

// const upload = multer({ storage: multer.memoryStorage() });

// // ---------------------------
// // Helpers
// // ---------------------------
// async function buildImageData(file) {
//   if (!file) return '';
//   const base64 = file.buffer.toString('base64');
//   const mimeType = file.mimetype || mime.lookup(file.originalname) || 'image/jpeg';
//   return `data:${mimeType};base64,${base64}`;
// }

// /**
//  * maybeAuth middleware: optional auth.
//  * If Authorization Bearer <jwt> is provided and valid, sets req.user and req.userId.
//  * If not present or invalid, continues without error (useful for public endpoints that can accept optional user).
//  */
// async function maybeAuth(req, _res, next) {
//   try {
//     const header = req.headers.authorization;
//     if (!header) {
//       return next();
//     }
//     const token = header.startsWith('Bearer ') ? header.split(' ')[1] : header;
//     // try JWT fallback only (this is the lightweight optional auth; the main auth middleware uses Firebase admin too)
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.userId).select('-password');
//       if (user) {
//         req.user = user;
//         req.userId = user._id.toString();
//       }
//     } catch (_e) {
//       // ignore invalid token for maybeAuth
//     }
//     return next();
//   } catch (err) {
//     console.error('maybeAuth error', err);
//     return next();
//   }
// }

// // ---------------------------
// // Test route
// // ---------------------------
// router.get('/test', (req, res) => {
//   console.log('✅ Report routes loaded');
//   res.json({ success: true, message: 'Report routes working' });
// });

// // ---------------------------
// // Create report endpoints (authenticated required)
// // ---------------------------
// router.post('/report-lost', auth, upload.single('image'), async (req, res) => {
//   try {
//     console.log('📨 POST /api/report-lost by', req.userId || 'unknown');
//     const {
//       title = '',
//       description = '',
//       location = '',
//       date = '',
//       contactNumber = '',
//       category = '',
//       subcategory = '',
//       whereKept = '',
//       contactPreference = ''
//     } = req.body;

//     const imageUrl = await buildImageData(req.file);

//     // Ensure correct userId usage
//     const userId = req.userId || (req.user && req.user._id ? req.user._id.toString() : null);

//     const doc = new LostItem({
//       title,
//       description,
//       location,
//       date: date || new Date().toISOString().slice(0, 10),
//       contactNumber,
//       category,
//       subcategory,
//       imageUrl,
//       userId,
//       userName: req.user?.name || '',
//       userEmail: req.user?.email || '',
//       userContact: contactNumber,
//       whereKept,
//       contactPreference,
//       approvalStatus: 'pending',
//       status: 'Active'
//     });

//     await doc.save();
//     console.log('✅ Lost saved', doc._id);
//     return res.status(201).json({ success: true, item: doc });
//   } catch (err) {
//     console.error('❌ report-lost error', err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// router.post('/report-found', auth, upload.single('image'), async (req, res) => {
//   try {
//     console.log('📨 POST /api/report-found by', req.userId || 'unknown');
//     // Found item requires an image in your previous code, keep that behavior
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: 'Image required for found items' });
//     }

//     const {
//       title = '',
//       description = '',
//       location = '',
//       date = '',
//       contactNumber = '',
//       category = '',
//       subcategory = '',
//       whereKept = ''
//     } = req.body;

//     const imageUrl = await buildImageData(req.file);
//     const userId = req.userId || (req.user && req.user._id ? req.user._id.toString() : null);

//     const doc = new FoundItem({
//       title,
//       description,
//       location,
//       date: date || new Date().toISOString().slice(0, 10),
//       contactNumber,
//       category,
//       subcategory,
//       imageUrl,
//       userId,
//       userName: req.user?.name || '',
//       userEmail: req.user?.email || '',
//       userContact: contactNumber,
//       whereKept,
//       approvalStatus: 'pending',
//       status: 'Active'
//     });

//     await doc.save();
//     console.log('✅ Found saved', doc._id);
//     return res.status(201).json({ success: true, item: doc });
//   } catch (err) {
//     console.error('❌ report-found error', err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ---------------------------
// // Public simple list endpoints for lost/found items
// // ---------------------------
// router.get('/items/lost', async (req, res) => {
//   try {
//     const { page = 1, limit = 20 } = req.query;
//     const p = Math.max(parseInt(page, 10) || 1, 1);
//     const l = Math.max(parseInt(limit, 10) || 20, 1);
//     const skip = (p - 1) * l;

//     const items = await LostItem.find().sort({ createdAt: -1 }).skip(skip).limit(l).lean();
//     return res.json({ success: true, items, page: p });
//   } catch (err) {
//     console.error('❌ GET /items/lost error', err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// router.get('/items/found', async (req, res) => {
//   try {
//     const { page = 1, limit = 20 } = req.query;
//     const p = Math.max(parseInt(page, 10) || 1, 1);
//     const l = Math.max(parseInt(limit, 10) || 20, 1);
//     const skip = (p - 1) * l;

//     const items = await FoundItem.find().sort({ createdAt: -1 }).skip(skip).limit(l).lean();
//     return res.json({ success: true, items, page: p });
//   } catch (err) {
//     console.error('❌ GET /items/found error', err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ---------------------------
// // Combined items endpoint (lost + found) with filters & paging
// // GET /api/items
// // ---------------------------
// router.get('/items', async (req, res) => {
//   try {
//     const { category, status, q, page = 1, limit = 20, startDate, endDate } = req.query;
//     const pageNum = Math.max(parseInt(page, 10) || 1, 1);
//     const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
//     const skip = (pageNum - 1) * limitNum;

//     // Build queries for each collection
//     const commonQuery = {};
//     if (category) commonQuery.category = category;
//     if (status) commonQuery.status = status;
//     if (q) commonQuery.$or = [
//       { title: { $regex: q, $options: 'i' } },
//       { description: { $regex: q, $options: 'i' } }
//     ];

//     const dateCriteria = {};
//     if (startDate) dateCriteria.$gte = new Date(startDate);
//     if (endDate) dateCriteria.$lte = new Date(endDate);

//     if (Object.keys(dateCriteria).length) {
//       commonQuery.createdAt = dateCriteria;
//     }

//     const [lostDocs, foundDocs] = await Promise.all([
//       LostItem.find(commonQuery).populate('user', 'email').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
//       FoundItem.find(commonQuery).populate('user', 'email').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean()
//     ]);

//     const mapLost = lostDocs.map(i => ({
//       _id: `lost_${i._id.toString()}`,
//       id: `lost_${i._id.toString()}`,
//       itemType: 'Lost',
//       title: i.title,
//       description: i.description,
//       category: i.category,
//       location: i.location,
//       date: i.date,
//       imageUrl: i.imageUrl || '',
//       status: i.status || 'Active',
//       userName: i.userName || '',
//       userContact: i.userContact || '',
//       userEmail: (i.user && i.user.email) ? i.user.email : (i.userEmail || ''),
//       createdAt: i.createdAt
//     }));

//     const mapFound = foundDocs.map(i => ({
//       _id: `found_${i._id.toString()}`,
//       id: `found_${i._id.toString()}`,
//       itemType: 'Found',
//       title: i.title,
//       description: i.description,
//       category: i.category,
//       location: i.location,
//       date: i.date,
//       imageUrl: i.imageUrl || '',
//       status: i.status || 'Active',
//       userName: i.userName || '',
//       userContact: i.userContact || '',
//       userEmail: i.userEmail || '',
//       createdAt: i.createdAt
//     }));

//     const combined = [...mapLost, ...mapFound].sort((a, b) => {
//       const ta = new Date(a.createdAt).getTime() || 0;
//       const tb = new Date(b.createdAt).getTime() || 0;
//       return tb - ta;
//     });

//     const total = combined.length;
//     const pagedItems = combined.slice(0, limitNum);

//     return res.json({
//       success: true,
//       items: pagedItems,
//       total,
//       page: pageNum,
//       totalPages: Math.max(Math.ceil(total / limitNum), 1)
//     });

//   } catch (err) {
//     console.error('❌ GET /items error', err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ---------------------------
// // GET single item by prefixed id OR raw id
// // /api/items/:id
// // ---------------------------
// router.get('/items/:id', async (req, res) => {
//   try {
//     const raw = req.params.id || '';
//     const [prefix, id] = raw.split('_');

//     let doc = null;
//     if (prefix === 'lost' && id) {
//       doc = await LostItem.findById(id).lean();
//     } else if (prefix === 'found' && id) {
//       doc = await FoundItem.findById(id).lean();
//     } else {
//       // try both collections by raw id
//       doc = await LostItem.findById(raw).lean();
//       if (!doc) doc = await FoundItem.findById(raw).lean();
//     }

//     if (!doc) return res.status(404).json({ success: false, message: 'Item not found' });
//     return res.json({ success: true, item: doc });
//   } catch (err) {
//     console.error('❌ GET /items/:id error', err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ---------------------------
// // Authenticated: get user's items
// // GET /api/user/items
// // ---------------------------
// router.get('/user/items', auth, async (req, res) => {
//   try {
//     const userId = req.userId || (req.user && req.user._id ? req.user._id.toString() : null);
//     if (!userId) return res.status(400).json({ success: false, message: 'Missing user id' });

//     const [lost, found] = await Promise.all([
//       LostItem.find({ userId }).sort({ createdAt: -1 }).lean(),
//       FoundItem.find({ userId }).sort({ createdAt: -1 }).lean()
//     ]);

//     return res.json({ success: true, lost, found });
//   } catch (err) {
//     console.error('❌ GET /user/items error', err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ---------------------------
// // Authenticated: get user's stats
// // GET /api/user/stats
// // ---------------------------
// router.get('/user/stats', auth, async (req, res) => {
//   try {
//     const userId = req.userId || (req.user && req.user._id ? req.user._id.toString() : null);
//     if (!userId) return res.status(400).json({ success: false, message: 'Missing user id' });

//     const [lostCount, foundCount] = await Promise.all([
//       LostItem.countDocuments({ userId }),
//       FoundItem.countDocuments({ userId })
//     ]);

//     const [claimedCount, returnedCount] = await Promise.all([
//       FoundItem.countDocuments({ userId, status: 'Claimed' }),
//       FoundItem.countDocuments({ userId, status: 'Returned' })
//     ]);

//     return res.json({
//       success: true,
//       stats: {
//         lostItemsReported: lostCount,
//         foundItemsReported: foundCount,
//         claimedItems: claimedCount,
//         itemsReturned: returnedCount
//       }
//     });
//   } catch (err) {
//     console.error('❌ GET /user/stats error', err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// module.exports = router;

