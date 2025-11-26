const express = require('express');
const router = express.Router();
const multer = require('multer');
const mime = require('mime-types');
const ClaimRequest = require('../models/ClaimRequest');
const FoundItem = require('../models/foundItem');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { sendClaimSubmittedEmail, sendClaimStatusEmail } = require('../utils/email');

const upload = multer({ storage: multer.memoryStorage() });

// POST - Create a new claim
router.post('/', auth, upload.single('proofImage'), async (req, res) => {
  try {
    const {
      itemId,
      itemType,
      name,
      email,
      studentId,
      contactNumber,
      proofDescription
    } = req.body;

    if (!itemId || !itemType || !name || !email || !studentId || !contactNumber || !proofDescription) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let proofImageUrl = '';
    if (req.file) {
      // Convert to base64 for storage in MongoDB
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype || mime.lookup(req.file.originalname) || 'image/jpeg';
      proofImageUrl = `data:${mimeType};base64,${base64}`;
    }

    const claim = new ClaimRequest({
      userId: req.userId,
      itemId,
      itemType,
      name,
      email,
      studentId,
      contactNumber,
      proofDescription,
      proofImageUrl
    });
    await claim.save();

    await Notification.create({
      userId: req.userId,
      type: 'claim_submitted',
      title: 'Claim request submitted',
      message: 'Your claim is under review by the admin team.',
      itemId,
      claimId: claim._id.toString()
    });
    try { await sendClaimSubmittedEmail(email, claim); } catch (_) {}

    return res.status(201).json({ success: true, claim });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET - Get user's claims (using JWT auth, no ID parameter)
router.get('/user', auth, async (req, res) => {
  try {
    const claims = await ClaimRequest.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json({ success: true, claims });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET - Get user's claims by ID (for backward compatibility)
router.get('/user/:id', async (req, res) => {
  try {
    const claims = await ClaimRequest.find({ userId: req.params.id }).sort({ createdAt: -1 });
    return res.json({ success: true, claims });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET - Get all claims (admin only)
router.get('/all', auth, isAdmin, async (req, res) => {
  try {
    const claims = await ClaimRequest.find().sort({ createdAt: -1 });
    return res.json({ success: true, claims });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH - Update claim status (admin only)
router.patch('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const claim = await ClaimRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    if (status === 'approved' && claim.itemType === 'found') {
      await FoundItem.findByIdAndUpdate(claim.itemId, { status: 'Claimed' });
    }

    await Notification.create({
      userId: claim.userId,
      type: 'claim_status',
      title: 'Claim status updated',
      message: `Your claim has been ${status}.`,
      itemId: claim.itemId,
      claimId: claim._id.toString()
    });
    try { await sendClaimStatusEmail(claim.email, claim); } catch (_) {}

    return res.json({ success: true, claim });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
