const express = require('express');
const router = express.Router();
const multer = require('multer');
const mime = require('mime-types');
const { supabase } = require('../utils/supabase');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');

const upload = multer({ storage: multer.memoryStorage() });

// Test endpoint
router.get('/test', (req, res) => {
  console.log('✅ Report routes are loaded');
  res.json({ success: true, message: 'Report routes are working' });
});

// POST /api/report-lost
router.post('/report-lost', upload.single('image'), async (req, res) => {
  try {
    console.log('✅ [REPORT-LOST] Endpoint reached');
    console.log('📝 Body:', req.body);
    console.log('📷 File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    
    const { title, description, location, date, contactNumber, category } = req.body;
    let imageUrl = '';

    if (req.file) {
      const fileName = req.file.originalname.replace(/\s+/g, '_');
      const timestamp = Date.now();
      const path = `lost/${timestamp}-${fileName}`;
      const contentType = req.file.mimetype || mime.lookup(fileName) || 'application/octet-stream';

      const { error: upErr } = await supabase.storage
        .from('items')
        .upload(path, req.file.buffer, { contentType });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('items').getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }

    const doc = new LostItem({ title, description, location, date, contactNumber, category, imageUrl });
    await doc.save();
    return res.status(201).json({ success: true, item: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error reporting item', error: error.message });
  }
});

// POST /api/report-found
router.post('/report-found', upload.single('image'), async (req, res) => {
  try {
    console.log('✅ [REPORT-FOUND] Endpoint reached');
    console.log('📝 Body:', req.body);
    console.log('📷 File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    
    const { title, description, location, date, contactNumber, category } = req.body;
    let imageUrl = '';

    if (req.file) {
      const fileName = req.file.originalname.replace(/\s+/g, '_');
      const timestamp = Date.now();
      const path = `found/${timestamp}-${fileName}`;
      const contentType = req.file.mimetype || mime.lookup(fileName) || 'application/octet-stream';

      const { error: upErr } = await supabase.storage
        .from('items')
        .upload(path, req.file.buffer, { contentType });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('items').getPublicUrl(path);
      imageUrl = pub.publicUrl;
    } else {
      return res.status(400).json({ success: false, message: 'Image required for found items' });
    }

    const doc = new FoundItem({ title, description, location, date, contactNumber, category, imageUrl });
    await doc.save();
    return res.status(201).json({ success: true, item: doc });
  } catch (error) {
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