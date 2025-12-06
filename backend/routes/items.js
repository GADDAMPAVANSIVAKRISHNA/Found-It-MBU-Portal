const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = require('../middleware/auth');

// Optional auth: populate req.user if a valid token is present; otherwise continue
async function maybeAuth(req, _res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
        req.userId = decoded.userId;
      }
    }
  } catch (_) { }
  next();
}

// Models (your project already had these)
const Item = require('../models/item');           // legacy combined model (kept for compatibility)
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const ClaimedItem = require('../models/ClaimedItem');

// -----------------------------
// Helper: normalize image input
// - If you use multer, req.file will exist: use it and upload to storage
// - If frontend already uploads to Firebase and sends imageUrl, use req.body.imageUrl
// Replace `uploadFileToStorage` with your actual uploader (firebase admin helper).
// -----------------------------
async function resolveImageUrl(reqBody, reqFile) {
  // Priority: reqFile (uploaded file) -> reqBody.imageUrl -> null
  if (reqFile) {
    // TODO: replace this with your real image upload logic
    // Example:
    // const uploadedUrl = await uploadFileToStorage(reqFile); 
    // return uploadedUrl;
    // For now, if multer stores file path in reqFile.path:
    if (reqFile.path) return reqFile.path;
    if (reqFile.location) return reqFile.location; // for some upload middleware
  }
  if (reqBody.imageUrl) return reqBody.imageUrl;
  if (reqBody.image_url) return reqBody.image_url;
  return null;
}

// -----------------------------
// CREATE LOST ITEM
// Routes:
// POST /lost
// POST /lost-items (alias)
// -----------------------------
async function createLostHandler(req, res) {
  try {
    // If using multer, file will be in req.file
    const imageUrl = await resolveImageUrl(req.body, req.file);

    // Validate required
    if (!req.body.title || !req.body.description) {
      return res.status(400).json({ success: false, message: 'Title and description required' });
    }

    const payload = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || 'Others',
      subcategory: req.body.subcategory || '',
      location: req.body.location || req.body.approximateLocation || '',
      date: req.body.dateLost || req.body.date || req.body.dateLostISO || new Date(),
      imageUrl,
      status: req.body.status || 'Active',
      userId: req.userId || null,
      userName: req.user?.name || req.body.userName || '',
      userContact: req.user?.contactNumber || req.body.contactNumber || req.body.mobile || req.body.contact || '',
      userEmail: req.user?.email || req.body.email || ''
    };

    const lost = new LostItem(payload);
    await lost.save();

    // Also create legacy Item document for compatibility (optional)
    try {
      if (Item) {
        const legacy = new Item({
          title: payload.title,
          description: payload.description,
          category: payload.category,
          location: payload.location,
          dateLost: payload.date,
          imageUrl: payload.imageUrl,
          status: payload.status,
          itemType: 'Lost',
          userId: payload.userId
        });
        await legacy.save();
      }
    } catch (e) {
      // non-fatal
      console.warn('Legacy Item save failed:', e.message);
    }

    return res.status(201).json({ success: true, item: lost });
  } catch (err) {
    console.error('createLostHandler error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

router.post('/lost', maybeAuth, createLostHandler);
router.post('/lost-items', maybeAuth, createLostHandler); // alias for older frontend

// -----------------------------
// CREATE FOUND ITEM
// Routes:
// POST /found
// POST /found-items (alias)
// -----------------------------
async function createFoundHandler(req, res) {
  try {
    const imageUrl = await resolveImageUrl(req.body, req.file);

    // Image required for found items (enforced here)
    if (!imageUrl && !req.body.image && !req.file) {
      return res.status(400).json({ success: false, message: 'Image mandatory for found items' });
    }

    if (!req.body.title || !req.body.description) {
      return res.status(400).json({ success: false, message: 'Title and description required' });
    }

    const payload = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || 'Others',
      subcategory: req.body.subcategory || '',
      location: req.body.location || '',
      date: req.body.dateFound || req.body.date || new Date(),
      imageUrl,
      status: req.body.status || 'Active',
      whereKept: req.body.whereKept || req.body.where_is_kept || '', // optional
      userId: req.userId || null,
      userName: req.user?.name || req.body.userName || '',
      userContact: req.user?.contactNumber || req.body.contactNumber || req.body.contact || '',
      userEmail: req.user?.email || req.body.email || ''
    };

    const found = new FoundItem(payload);
    await found.save();

    // Also create legacy Item doc (optional)
    try {
      if (Item) {
        const legacy = new Item({
          title: payload.title,
          description: payload.description,
          category: payload.category,
          location: payload.location,
          dateFound: payload.date,
          imageUrl: payload.imageUrl,
          status: payload.status,
          itemType: 'Found',
          userId: payload.userId
        });
        await legacy.save();
      }
    } catch (e) {
      console.warn('Legacy Item save failed:', e.message);
    }

    return res.status(201).json({ success: true, item: found });
  } catch (err) {
    console.error('createFoundHandler error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

router.post('/found', maybeAuth, createFoundHandler);
router.post('/found-items', maybeAuth, createFoundHandler); // alias for older frontend

// -----------------------------
// GET /items
// Combined list of lost + found items
// Supports filters: category, status (Active/Claimed/Returned), q (search), page, limit, sort
// Returns: { success:true, items: [], total, page, totalPages }
// -----------------------------
router.get('/items', async (req, res) => {
  try {
    const {
      category,
      status,      // Active / Claimed / Returned
      q,           // search query (title/description)
      page = 1,
      limit = 20,
      sort = 'recent'
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const commonQuery = {};
    if (category) commonQuery.category = category;
    if (status) commonQuery.status = status;
    if (q) {
      commonQuery.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    const sortMap = {
      recent: { createdAt: -1 },
      oldest: { createdAt: 1 },
      title_az: { title: 1 }
    };
    const sortOpt = sortMap[sort] || sortMap.recent;

    // Query both collections in parallel
    const [lostDocs, lostCount, foundDocs, foundCount] = await Promise.all([
      LostItem.find({ ...commonQuery, approvalStatus: { $ne: 'removed' } })
        .sort(sortOpt)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      LostItem.countDocuments({ ...commonQuery, approvalStatus: { $ne: 'removed' } }),
      FoundItem.find({ ...commonQuery, approvalStatus: { $ne: 'removed' } })
        .sort(sortOpt)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FoundItem.countDocuments({ ...commonQuery, approvalStatus: { $ne: 'removed' } })
    ]);

    // Normalize items into unified shape
    const mapLost = lostDocs.map(i => ({
      _id: `lost_${i._id.toString()}`,
      id: `lost_${i._id.toString()}`,
      itemType: 'Lost',
      title: i.title,
      description: i.description,
      category: i.category,
      subcategory: i.subcategory,
      location: i.location || i.approximateLocation || '',
      date: i.date || i.dateLost || i.createdAt,
      imageUrl: i.imageUrl || i.image_url || '',
      status: i.status || 'Active',
      userId: i.userId || null,
      userName: i.userName || '',
      userContact: i.userContact || '',
      userEmail: i.userEmail || '',
      createdAt: i.createdAt
    }));

    const mapFound = foundDocs.map(i => ({
      _id: `found_${i._id.toString()}`,
      id: `found_${i._id.toString()}`,
      itemType: 'Found',
      title: i.title,
      description: i.description,
      category: i.category,
      subcategory: i.subcategory,
      location: i.location || '',
      date: i.date || i.dateFound || i.createdAt,
      imageUrl: i.imageUrl || i.image_url || '',
      status: i.status || 'Active',
      userId: i.userId || null,
      userName: i.userName || '',
      userContact: i.userContact || '',
      userEmail: i.userEmail || '',
      createdAt: i.createdAt
    }));

    // Combine and sort by createdAt descending
    const combined = [...mapFound, ...mapLost].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = lostCount + foundCount;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // Apply pagination to combined list (server-side)
    const pagedItems = combined.slice(skip, skip + limitNum);

    return res.json({
      success: true,
      items: pagedItems,
      total,
      page: pageNum,
      totalPages
    });
  } catch (err) {
    console.error('GET /items error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// GET single item:
// - GET /items/:id  <-- accepts id prefixed with lost_ or found_
// - GET /lost/:id
// - GET /found/:id
// -----------------------------
async function fetchItemByPrefixedId(prefixedId) {
  // prefixedId e.g. lost_614... or found_614...
  if (!prefixedId) return null;
  const [prefix, id] = prefixedId.split('_');
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  if (prefix === 'lost') {
    return LostItem.findById(id).lean();
  }
  if (prefix === 'found') {
    return FoundItem.findById(id).lean();
  }
  // fallback: try both by raw id
  let doc = await LostItem.findById(prefixedId).lean();
  if (doc) return doc;
  doc = await FoundItem.findById(prefixedId).lean();
  return doc;
}

router.get('/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    // Accept both prefixed and raw
    let doc = null;

    if (itemId.includes('_')) {
      doc = await fetchItemByPrefixedId(itemId);
      if (!doc) return res.status(404).json({ success: false, message: 'Item not found' });
      const isLost = itemId.startsWith('lost_');
      return res.json({
        success: true,
        item: {
          id: itemId,
          itemType: isLost ? 'Lost' : 'Found',
          title: doc.title,
          description: doc.description,
          category: doc.category,
          subcategory: doc.subcategory,
          location: doc.location,
          date: doc.date,
          imageUrl: doc.imageUrl,
          status: doc.status,
          userName: doc.userName,
          userContact: doc.userContact
        }
      });
    }

    // raw id fallback: search LostItem first then FoundItem
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    doc = await LostItem.findById(itemId).lean();
    if (doc) {
      return res.json({ success: true, item: { id: `lost_${doc._id}`, itemType: 'Lost', ...doc } });
    }
    doc = await FoundItem.findById(itemId).lean();
    if (doc) {
      return res.json({ success: true, item: { id: `found_${doc._id}`, itemType: 'Found', ...doc } });
    }
    return res.status(404).json({ success: false, message: 'Item not found' });
  } catch (err) {
    console.error('GET /items/:id error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/lost/:id', async (req, res) => {
  try {
    const doc = await LostItem.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, item: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/found/:id', async (req, res) => {
  try {
    const doc = await FoundItem.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, item: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// GET /lost and GET /found (list only that type) with pagination/filter
// -----------------------------
router.get('/lost', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, q } = req.query;
    const query = {};
    if (category) query.category = category;
    if (q) query.$or = [{ title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      LostItem.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      LostItem.countDocuments(query)
    ]);

    res.json({ success: true, items: docs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) || 1 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/found', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, q } = req.query;
    const query = {};
    if (category) query.category = category;
    if (q) query.$or = [{ title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      FoundItem.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      FoundItem.countDocuments(query)
    ]);

    res.json({ success: true, items: docs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) || 1 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// GET /items/user  (protected) -> { lost: [], found: [] }
// -----------------------------
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const [lost, found] = await Promise.all([
      LostItem.find({ userId }).sort({ createdAt: -1 }).lean(),
      FoundItem.find({ userId }).sort({ createdAt: -1 }).lean()
    ]);
    res.json({ success: true, lost, found });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// POST /items/:prefixedId/claim or /:id/claim (keeps claim logic)
// - Accepts prefixed id or raw id.
// -----------------------------
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const pref = req.params.id;
    let prefix, id;
    if (pref.includes('_')) {
      [prefix, id] = pref.split('_');
    } else {
      id = pref;
      // try to find which collection contains this id
      const inLost = await LostItem.findById(id).lean();
      prefix = inLost ? 'lost' : 'found';
    }

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    // Allow claiming only found items
    if (prefix === 'lost') {
      return res.status(400).json({ success: false, message: 'Cannot claim a lost item' });
    }

    const foundDoc = await FoundItem.findById(id);
    if (!foundDoc) return res.status(404).json({ success: false, message: 'Item not found' });
    if (foundDoc.status !== 'Active') return res.status(400).json({ success: false, message: 'Item not claimable' });

    const claim = new ClaimedItem({
      itemId: foundDoc._id,
      claimedBy: req.userId,
      claimerName: req.user?.name || '',
      claimerBranch: req.user?.branch || '',
      claimerYear: req.user?.year || '',
      claimerContact: req.user?.contactNumber || req.body.contactNumber || ''
    });

    await claim.save();

    foundDoc.status = 'Claimed';
    foundDoc.claimedBy = req.userId;
    await foundDoc.save();

    return res.json({ success: true, message: 'Item claimed successfully' });
  } catch (err) {
    console.error('POST /:id/claim error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// KEEP backward-compatible /items (old create route) - optional
// POST / (creates generic Item) - protected
// -----------------------------
router.post('/', auth, async (req, res) => {
  try {
    // Legacy: create a generic Item doc (not recommended long-term)
    const imageUrl = await resolveImageUrl(req.body, req.file);
    const payload = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || '',
      location: req.body.location || '',
      dateLost: req.body.dateLost || req.body.date || new Date(),
      dateFound: req.body.dateFound || req.body.date || new Date(),
      imageUrl,
      status: req.body.status || 'Active',
      itemType: req.body.itemType || 'Lost',
      userId: req.userId || null,
    };

    const itm = new Item(payload);
    await itm.save();
    return res.status(201).json({ success: true, item: itm });
  } catch (err) {
    console.error('Legacy POST / error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// DELETE /:id
// Only owner can delete. Only 'Active' items can be deleted.
// -----------------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    const rawId = req.params.id;
    let doc = null;
    let model = null;

    // Resolve model and doc
    if (rawId.startsWith('lost_')) {
      model = LostItem;
      doc = await model.findById(rawId.split('_')[1]);
    } else if (rawId.startsWith('found_')) {
      model = FoundItem;
      doc = await model.findById(rawId.split('_')[1]);
    } else {
      // try lost then found
      model = LostItem;
      doc = await model.findById(rawId);
      if (!doc) {
        model = FoundItem;
        doc = await model.findById(rawId);
      }
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Check ownership
    if (!doc.userId || doc.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized execution' });
    }

    // Check status
    if (doc.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Cannot delete item that is Claimed or Returned' });
    }

    await model.deleteOne({ _id: doc._id });
    return res.json({ success: true, message: 'Item deleted successfully' });

  } catch (err) {
    console.error('DELETE /:id error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
