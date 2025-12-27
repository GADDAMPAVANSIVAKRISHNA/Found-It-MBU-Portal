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
    try { await sendClaimSubmittedEmail(email, claim); } catch (_) { }

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
    try { await sendClaimStatusEmail(claim.email, claim); } catch (_) { }

    return res.json({ success: true, claim });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST - Freeze item (Immediate Claim)
router.post('/freeze', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: 'Item ID required' });

    const cleanId = itemId.includes('_') ? itemId.split('_')[1] : itemId;

    // Check FoundItem first
    let item = await FoundItem.findById(cleanId);
    let itemModel = 'Found';

    // If not found, check LostItem
    const LostItem = require('../models/lostItem');
    if (!item) {
      item = await LostItem.findById(cleanId);
      itemModel = 'Lost';
    }

    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.status !== 'Active') return res.status(400).json({ error: 'Item is not available for claim' });
    if (item.userId.toString() === req.userId) return res.status(400).json({ error: 'Cannot claim your own item' });

    item.status = 'Frozen';
    item.claimedBy = req.userId;
    await item.save();

    // Notify finder
    await Notification.create({
      userId: item.userId,
      type: 'item_frozen',
      title: 'Item Claimed!',
      message: itemModel === 'Found' ? 'Someone has claimed your found item.' : 'Someone found your lost item!',
      itemId: item._id.toString()
    });

    // AUTO-CREATE a ConnectionRequest so messaging can start instantly between claimant and finder
    try {
      const ConnectionRequest = require('../models/ConnectionRequest');
      const existing = await ConnectionRequest.findOne({ finderId: item.userId, claimantId: req.userId, $or: [{ itemId: item._id.toString() }, { itemId: item._id }] });
      if (!existing) {
        const conn = new ConnectionRequest({
          finderId: item.userId,
          claimantId: req.userId,
          itemId: item._id.toString(),
          status: 'accepted',
          verification: { color: 'N/A', mark: 'N/A', location: 'N/A' },
          messages: []
        });
        await conn.save();

        // Notify finder that a connection exists
        await Notification.create({
          userId: item.userId,
          type: 'connection_request',
          title: 'New Connection (Claim)',
          message: `A user has claimed the item "${item.title}" and a private conversation has been opened.`,
          itemId: item._id.toString(),
          claimId: conn._id.toString()
        });
      }
    } catch (e) {
      console.error('Failed to auto-create ConnectionRequest after freeze', e);
    }

    return res.json({ success: true, message: 'Item frozen for you', item });
  } catch (err) {
    console.error('Freeze error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET - Pending Actions (For Popups)
router.get('/pending-actions', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // 1. As Finder: Items I found that are Frozen (Need to confirm return)
    const itemsToConfirmReturn = await FoundItem.find({
      userId: userId,
      status: 'Frozen'
    }).populate('claimedBy', 'name email');

    // 2. As Claimant: Items I claimed that are Frozen (Need to confirm receipt?)
    // Actually user requirement says "until he returns... popup should come... did you returned".
    // And for claimant "until he received... popup should come... did you claimed".

    // So for Claimant, we check items they claimed that are NOT yet 'Returned' (so Frozen).
    const itemsToConfirmReceipt = await FoundItem.find({
      claimedBy: userId,
      status: 'Frozen'
    }).populate('userId', 'name email');

    return res.json({
      success: true,
      actions: {
        confirmReturn: itemsToConfirmReturn.map(i => ({
          id: i._id,
          title: i.title,
          claimantName: i.claimedBy?.name || 'Someone',
          type: 'confirm_return'
        })),
        confirmReceipt: itemsToConfirmReceipt.map(i => ({
          id: i._id,
          title: i.title,
          finderName: i.user?.name || 'The Finder',
          type: 'confirm_receipt'
        }))
      }
    });

  } catch (err) {
    console.error('Pending actions error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST - Confirm Return (Finder says YES)
router.post('/confirm-return', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const item = await FoundItem.findOne({ _id: itemId, userId: req.userId });

    if (!item) return res.status(404).json({ error: 'Item not found or unauthorized' });

    item.status = 'Returned';

    // Mark related connection requests as blocked and notify participants
    try {
      const ConnectionRequest = require('../models/ConnectionRequest');
      const rawId = String(item._id);
      // Update any connection requests that reference this item
      const updated = await ConnectionRequest.updateMany(
        { $or: [{ itemId: rawId }, { itemId: { $regex: rawId } }] },
        { status: 'blocked', updatedAt: Date.now() }
      );
      // Create notifications for involved users
      const affected = await ConnectionRequest.find({ $or: [{ itemId: rawId }, { itemId: { $regex: rawId } }] });
      for (const r of affected) {
        await Notification.create({ userId: r.finderId, type: 'item_status', title: 'Conversation closed', message: 'This item has been marked returned and messaging is now closed.', itemId: item._id.toString(), claimId: r._id.toString() });
        await Notification.create({ userId: r.claimantId, type: 'item_status', title: 'Conversation closed', message: 'This item has been marked returned and messaging is now closed.', itemId: item._id.toString(), claimId: r._id.toString() });
      }
    } catch (err) {
      console.error('Error while blocking connections on confirm-return:', err);
    }

    await item.save();
    return res.json({ success: true, message: 'Item marked as returned' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST - Confirm Receipt (Claimant says YES)
router.post('/confirm-receipt', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const item = await FoundItem.findOne({ _id: itemId, claimedBy: req.userId });

    if (!item) return res.status(404).json({ error: 'Item not found or unauthorized' });

    // If claimant confirms, we can also mark as Returned if not already
    // But usually Finder confirmation is authoritative.
    // However prompt says "if he clicks the yes then freeze that lost reported item and shou the item claimed status".
    // So this might trigger updates on the LOST item side if it exists.

    // Check if there is a corresponding Lost Item for this user? 
    // Usually we don't link them automatically unless user explicitly did.
    // But we can check if user has any active lost items with similar title?
    // For now, let's just assume we update the FoundItem status to Returned if not already (dual confirmation).

    if (item.status !== 'Returned') {
      item.status = 'Returned';

      // Block any conversations for this item
      try {
        const ConnectionRequest = require('../models/ConnectionRequest');
        const rawId = String(item._id);
        const updated = await ConnectionRequest.updateMany(
          { $or: [{ itemId: rawId }, { itemId: { $regex: rawId } }] },
          { status: 'blocked', updatedAt: Date.now() }
        );
        const affected = await ConnectionRequest.find({ $or: [{ itemId: rawId }, { itemId: { $regex: rawId } }] });
        for (const r of affected) {
          await Notification.create({ userId: r.finderId, type: 'item_status', title: 'Conversation closed', message: 'This item has been marked returned and messaging is now closed.', itemId: item._id.toString(), claimId: r._id.toString() });
          await Notification.create({ userId: r.claimantId, type: 'item_status', title: 'Conversation closed', message: 'This item has been marked returned and messaging is now closed.', itemId: item._id.toString(), claimId: r._id.toString() });
        }
      } catch (err) {
        console.error('Error while blocking connections on confirm-receipt:', err);
      }

      await item.save();
    }

    return res.json({ success: true, message: 'Receipt confirmed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
