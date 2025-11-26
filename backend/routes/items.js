const express = require('express');
const router = express.Router();
const Item = require('../models/item');
const ClaimedItem = require('../models/ClaimedItem');
const auth = require('../middleware/auth');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');

// ========================
//  GENERAL ROUTES
// ========================

router.post('/', auth, async (req, res) => {
  try {
    if (req.body.itemType === 'Found' && !req.body.image) {
      return res.status(400).json({ error: 'Image mandatory for found items' });
    }

    const item = new Item({
      ...req.body,
      userId: req.userId,
      userName: req.user.name,
      userContact: req.user.contactNumber
    });

    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { type, category, search, status } = req.query;
    let query = {};

    if (type) query.itemType = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Item.find(query).populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
//  SPECIFIC ROUTES FIRST (before /:id wildcards)
// ========================

// GET /items/user - Get logged-in user's items (lost and found) separated by type
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const [lost, found] = await Promise.all([
      LostItem.find({ userId }).sort({ createdAt: -1 }),
      FoundItem.find({ userId }).sort({ createdAt: -1 })
    ]);
    
    res.json({ lost, found });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /items/user/my-items - Alternative user items endpoint
router.get('/user/my-items', auth, async (req, res) => {
  try {
    const items = await Item.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /items/gallery - Browse all approved items
router.get('/gallery', async (req, res) => {
  try {
    const { category, subcategory, location, startDate, endDate, claimedStatus, sort = 'recent', page = 1, limit = 12 } = req.query;
    const q = {};
    if (category) q.category = category;
    if (subcategory) q.subcategory = subcategory;
    if (location) q.location = location;
    if (startDate || endDate) {
      const range = {};
      if (startDate) range.$gte = startDate;
      if (endDate) range.$lte = endDate;
      q.date = range;
    }
    if (claimedStatus) {
      q.status = claimedStatus === 'unclaimed' ? 'Active' : claimedStatus === 'returned' ? 'Returned' : 'Claimed';
    }

    const sortMap = {
      recent: { createdAt: -1 },
      oldest: { createdAt: 1 },
      category_az: { category: 1 }
    };
    const sortOpt = sortMap[sort] || sortMap.recent;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [lost, lostCount] = await Promise.all([
      LostItem.find({ ...q, approvalStatus: 'approved' }).sort(sortOpt).skip(skip).limit(parseInt(limit)),
      LostItem.countDocuments({ ...q, approvalStatus: 'approved' })
    ]);
    const [found, foundCount] = await Promise.all([
      FoundItem.find({ ...q, approvalStatus: 'approved' }).sort(sortOpt).skip(skip).limit(parseInt(limit)),
      FoundItem.countDocuments({ ...q, approvalStatus: 'approved' })
    ]);

    const items = [
      ...lost.map(i => ({
        id: `lost_${i._id.toString()}`,
        item_type: 'Lost',
        title: i.title,
        description: i.description,
        category: i.category,
        subcategory: i.subcategory,
        location: i.location,
        date: i.date,
        image_url: i.imageUrl,
        status: i.status
      })),
      ...found.map(i => ({
        id: `found_${i._id.toString()}`,
        item_type: 'Found',
        title: i.title,
        description: i.description,
        category: i.category,
        subcategory: i.subcategory,
        location: i.location,
        date: i.date,
        image_url: i.imageUrl,
        status: i.status
      }))
    ];

    res.json({ success: true, items, total: lostCount + foundCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /items/gallery/:type/:id - Get specific item details
router.get('/gallery/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = type === 'lost' ? LostItem : FoundItem;
    const item = await Model.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({
      success: true,
      item: {
        id: `${type}_${item._id.toString()}`,
        item_type: type === 'lost' ? 'Lost' : 'Found',
        title: item.title,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        location: item.location,
        date: item.date,
        image_url: item.imageUrl,
        status: item.status,
        user_name: item.userName,
        user_contact: item.userContact
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
//  ID-BASED WILDCARD ROUTES (/:id)
// ========================

router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('userId');
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/claim', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.itemType !== 'Found') return res.status(400).json({ error: 'Can only claim found items' });
    if (item.status !== 'Active') return res.status(400).json({ error: 'Item already claimed' });

    const claimedItem = new ClaimedItem({
      itemId: req.params.id,
      claimedBy: req.userId,
      claimerName: req.user.name,
      claimerBranch: req.user.branch,
      claimerYear: req.user.year,
      claimerContact: req.user.contactNumber
    });

    await claimedItem.save();
    item.status = 'Claimed';
    item.claimedBy = req.userId;
    await item.save();

    res.json({ message: 'Item claimed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backward compatibility: GET /items/user/:id (without auth)
router.get('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const lost = await LostItem.find({ userId }).sort({ createdAt: -1 });
    const found = await FoundItem.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, lost, found });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
