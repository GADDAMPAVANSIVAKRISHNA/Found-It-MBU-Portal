const express = require('express');
const router = express.Router();
const Item = require('../models/item');
const ClaimedItem = require('../models/ClaimedItem');
const auth = require('../middleware/auth');
// Ensure no Supabase DB usage in this file; MongoDB only

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

router.get('/user/my-items', auth, async (req, res) => {
  try {
    const items = await Item.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
