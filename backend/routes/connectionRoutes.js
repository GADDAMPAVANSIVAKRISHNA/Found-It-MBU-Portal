const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ConnectionRequest = require('../models/ConnectionRequest');
const Notification = require('../models/Notification');
const FoundItem = require('../models/foundItem'); // Assuming this exists
const User = require('../models/user');
const { sendNotificationEmail } = require('../utils/email');
const auth = require('../middleware/auth');

// @route   POST /api/connections/request
// @desc    Create a new connection request
router.post('/request', auth, async (req, res) => {
    const { itemId, verification, templateMessage } = req.body;
    const claimantId = req.userId;

    // Log incoming request for debugging
    console.log(`Connection request: claimant=${claimantId} itemId=${itemId}`);

    try {
        // 0. Basic payload validation
        if (!itemId) {
            console.warn('Connection request validation failed: missing itemId', { claimantId, itemId });
            return res.status(400).json({ message: 'Missing itemId', error: 'Missing itemId' });
        }

        if (!verification || !verification.color || !verification.mark || !verification.location) {
            console.warn('Connection request validation failed: incomplete verification', { claimantId, verification });
            return res.status(400).json({ message: 'Incomplete verification details', error: 'Incomplete verification details' });
        }

        if (!templateMessage) {
            console.warn('Connection request validation failed: missing templateMessage', { claimantId });
            return res.status(400).json({ message: 'Missing message template', error: 'Missing message template' });
        }

        // 1. Verify Item Exists
        const rawItemId = String(itemId || '');
        const resolvedItemId = rawItemId.includes('_') ? rawItemId.split('_')[1] : rawItemId;
        const item = await FoundItem.findById(resolvedItemId);
        if (!item) {
            console.warn('Connection request failed: item not found', { claimantId, resolvedItemId });
            return res.status(404).json({ message: 'Item not found', error: 'Item not found' });
        }

        // 2. Prevent Requesting Own Item
        if (String(item.userId) === String(claimantId)) {
            console.warn('Connection request blocked: self-request', { claimantId, itemId });
            return res.status(400).json({ message: 'You cannot claim your own item', error: 'Self request not allowed' });
        }

        // 3. Check for Existing Request (prevent duplicates)
        const existingRequest = await ConnectionRequest.findOne({
            finderId: item.userId,
            claimantId,
            $or: [{ itemId: rawItemId }, { itemId: resolvedItemId }]
        });

        if (existingRequest) {
            console.log('Existing request found — updating and appending message to enable instant chat', { claimantId, itemId, existingRequestId: existingRequest._id });

            // Merge verification details (keep whatever was already present unless blank)
            existingRequest.verification = existingRequest.verification || {};
            existingRequest.verification.color = existingRequest.verification.color || (verification && verification.color) || '';
            existingRequest.verification.mark = existingRequest.verification.mark || (verification && verification.mark) || '';
            existingRequest.verification.location = existingRequest.verification.location || (verification && verification.location) || '';

            // Auto-accept if not already accepted
            if (existingRequest.status !== 'accepted') {
                existingRequest.status = 'accepted';
            }

            // Append initial message to existing conversation
            if (templateMessage) {
                existingRequest.messages.push({ senderId: claimantId, text: templateMessage, timestamp: new Date() });
            }
            existingRequest.updatedAt = Date.now();

            await existingRequest.save();

            // Create Notification for Finder about the new message/update
            await Notification.create({
                userId: existingRequest.finderId,
                type: 'connection_request',
                title: 'Updated Connection Request',
                message: `Someone has updated their request regarding the item.`,
                itemId: existingRequest.itemId,
                claimId: existingRequest._id
            });

            return res.status(200).json({ message: 'Updated existing request and added message', request: existingRequest });
        }

        // 4. Create Request
        // UX change: auto-accept the connection so messaging behaves like a private chat
        const newRequest = new ConnectionRequest({
            finderId: item.userId,
            claimantId,
            itemId: rawItemId,
            status: 'accepted', // auto-accept to allow immediate messaging
            verification,
            messages: [{
                senderId: claimantId,
                text: templateMessage,
                timestamp: new Date()
            }]
        });
        console.log('Auto-accepting connection request for instant chat', { finderId: item.userId, claimantId, itemId: rawItemId });

        await newRequest.save();

        console.log('Connection request created', { requestId: newRequest._id.toString(), finderId: item.userId, claimantId, itemId: rawItemId });

        // 5. Send Notification to Finder
        const finder = await User.findById(item.userId);

        // In-App Notification
        await Notification.create({
            userId: item.userId,
            type: 'connection_request',
            title: 'New Connection Request',
            message: `Someone wants to connect regarding "${item.title}".`,
            itemId: rawItemId,
            claimId: newRequest._id
        });

        // Email Notification
        if (finder && finder.email) {
            const emailHtml = `
        <p>Hello ${finder.name},</p>
        <p>You have received a new connection request for the item: <strong>${item.title}</strong>.</p>
        <p>Please log in to Found-It to view the request and details.</p>
        <br/>
        <p>– Found-It Team</p>
      `;
            await sendNotificationEmail(finder.email, 'New Connection Request - Found-It', emailHtml).catch(console.error);
        }

        res.status(201).json({ message: 'Request sent successfully', request: newRequest });

    } catch (err) {
        console.error('Connection request error:', err && err.message, { claimantId, itemId });
        res.status(500).json({ message: 'Server error', error: err && (err.message || err.toString()) });
    }
});

// @route   GET /api/connections/my-requests
// @desc    Get all requests for the current user (as finder or claimant)
router.get('/my-requests', auth, async (req, res) => {
    try {
        const requests = await ConnectionRequest.find({
            $or: [{ finderId: req.userId }, { claimantId: req.userId }]
        }).sort({ updatedAt: -1 });

        // Populate item details manually or via populate if ref exists
        // Since itemId is just a string in schema (based on observation), we fetch manually or adjust schema.
        // Ideally ConnectionRequest schema should have ref: 'FoundItem' for populate.
        // For now, let's just return the requests and let frontend fetch item details if needed, 
        // OR we can do a quick aggregate.

        // Let's populate minimal item info if valid ObjectId
        // Adjusting strategy: fetch items in parallel
        const userId = String(req.userId);
        const enhancedRequests = await Promise.all(requests.map(async (r) => {
            const rawItemId = String(r.itemId || '');
            const resolvedItemId = rawItemId.includes('_') ? rawItemId.split('_')[1] : rawItemId;
            const item = await FoundItem.findById(resolvedItemId).select('title imageUrl');
            const otherUserId = String(r.finderId) === userId
                ? r.claimantId
                : r.finderId;
            // We do NOT reveal name/email here to privacy focused UI, maybe just a placeholder "User"
            // or if accepted, maybe names? Requirement says "No personal contact details". 
            // So we keep it anonymous unless accepted? 
            // Actually requirement says "Only the two involved users can see the messages".
            // Let's just return the raw request data.
            return {
                ...r.toObject(),
                itemTitle: item ? item.title : 'Unknown Item',
                itemImage: item ? item.imageUrl : null
            };
        }));

        res.json(enhancedRequests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/connections/:id
// @desc    Get single request details
router.get('/:id', auth, async (req, res) => {
    try {
        const request = await ConnectionRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Security: Only involved parties can view
        if (String(request.finderId) !== String(req.userId) &&
            String(request.claimantId) !== String(req.userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/connections/:id/respond
// @desc    Accept or Reject a request
router.put('/:id/respond', auth, async (req, res) => {
    const { action } = req.body; // 'accept' or 'reject'

    try {
        const request = await ConnectionRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Only finder can respond
        if (String(request.finderId) !== String(req.userId)) {
            return res.status(403).json({ message: 'Only the finder can respond to this request' });
        }

        if (action === 'accept') {
            request.status = 'accepted';
        } else if (action === 'reject') {
            request.status = 'rejected';
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        request.updatedAt = Date.now();
        await request.save();

        // Create Notification for Claimant
        await Notification.create({
            userId: request.claimantId,
            type: action === 'accept' ? 'connection_accepted' : 'connection_rejected',
            title: `Connection ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
            message: `The finder has ${action}ed your request regarding the item.`,
            itemId: request.itemId,
            claimId: request._id
        });

        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/connections/:id/message
// @desc    Send a template message (only if accepted)
router.post('/:id/message', auth, async (req, res) => {
    const { text } = req.body; // Must be a defined template in frontend

    try {
        const request = await ConnectionRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Must be participant
        if (String(request.finderId) !== String(req.userId) &&
            String(request.claimantId) !== String(req.userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Must be accepted
        if (request.status !== 'accepted') {
            return res.status(400).json({ message: 'Connection must be accepted to send messages' });
        }

        const newMessage = {
            senderId: req.userId,
            text,
            timestamp: new Date()
        };

        request.messages.push(newMessage);
        request.updatedAt = Date.now();
        await request.save();

        // Notify the other party
        const recipientId = String(request.finderId) === String(req.userId)
            ? request.claimantId
            : request.finderId;

        await Notification.create({
            userId: recipientId,
            type: 'new_message', // Need to make sure this is handled or add to enum if needed, used generic for update
            title: 'New Message',
            message: 'You have a new message in your connection.',
            claimId: request._id
        });

        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
