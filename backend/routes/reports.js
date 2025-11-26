const express = require('express');
const router = express.Router();
const multer = require('multer');
const mime = require('mime-types');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const firebaseAuth = require('../middleware/firebaseAuth');

const upload = multer({ storage: multer.memoryStorage() });

// Test endpoint
router.get('/test', (req, res) => {
  console.log('✅ Report routes are loaded');
  res.json({ success: true, message: 'Report routes are working' });
});

// POST /api/report-lost
router.post('/report-lost', firebaseAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('✅ [REPORT-LOST] Endpoint reached');
    console.log('📝 Body:', req.body);
    console.log('📷 File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    
    const { title, description, location, date, contactNumber, category, subcategory } = req.body;
    const userId = req.user?.id;
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
router.post('/report-found', firebaseAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('✅ [REPORT-FOUND] Endpoint reached');
    console.log('📝 Body:', req.body);
    console.log('📷 File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image required for found items' });
    }
    
    const { title, description, location, date, contactNumber, category, subcategory } = req.body;
    const userId = req.user?.id;
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
