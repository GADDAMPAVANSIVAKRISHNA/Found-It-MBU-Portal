import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ConnectModal = ({ item, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        message: ''
    });

    const isOwnItem = (() => {
        if (!user || !item) return false;
        const possibleUserIds = [user._id, user.uid, user.firebaseUid, user.id].filter(Boolean).map(String);
        return possibleUserIds.includes(String(item.userId));
    })();

    // Is current user the claimant (the one who froze the item)
    const isClaimant = (() => {
        if (!user || !item || !item.claimedBy) return false;
        const possibleUserIds = [user._id, user.uid, user.firebaseUid, user.id].filter(Boolean).map(String);
        return possibleUserIds.includes(String(item.claimedBy));
    })();

    // If Finder opens this modal on a frozen item, we likely want to just go to messages
    // effectively "View Request"
    if (isOwnItem && item.status === 'Frozen') {
        // We can't use useNavigate inside the render body technically, but in effect we can return null and useEffect
        // better: render a "Go to Messages" view or redirect immediately
        // Let's do a redirect effect
        // React.useEffect(() => { navigate('/messages'); onClose(); }, []);
        // BUT clean way: render a button "Open Chat"
    }

    // Extract Reporter Info
    const reportedEmail = item.userEmail || item.email || '';
    const reportedRollNo = item.rollNumber || (reportedEmail.includes('@') ? reportedEmail.split('@')[0] : 'N/A');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        if (!formData.message) return toast.error('Please enter a message');

        // Validation removed as per request, logic assumes implicit verification by clicking 'claim'

        // If the item is frozen and the current user is not the claimant, disallow messaging (should be blocked by UI anyway)
        if (item?.status === 'Frozen' && !isClaimant) {
            toast.error('Item is frozen — only the claimant can send verification messages');
            return;
        }

        if (isOwnItem) {
            toast.error('You cannot contact your own item.');
            return;
        }

        setLoading(true);

        // Optimistic draft request so user immediately sees a chat
        const tempId = `temp-${Date.now()}`;
        const senderId = user && (user._id || user.uid || user.firebaseUid) ? (user._id || user.uid || user.firebaseUid) : 'unknown';
        // Use hardcoded/dummy verification details to satisfy backend validation
        const verificationPayload = { color: 'Not Applicable', mark: 'Not Applicable', location: 'Not Applicable' };

        const draftRequest = {
            _id: tempId,
            finderId: item.userId,
            claimantId: senderId,
            itemId: item._id,
            itemTitle: item.title,
            status: 'pending',
            verification: verificationPayload,
            messages: [{ senderId, text: formData.message, timestamp: new Date().toISOString() }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Navigate to messages with draft (instant chat behavior)
        navigate('/messages', { state: { draftRequest } });
        onClose && onClose();

        try {
            const res = await apiFetch('/api/connections/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ itemId: item._id, verification: verificationPayload, templateMessage: formData.message })
            });

            if (res.ok) {
                // Update URL with real request id so Messages can fetch & replace
                navigate(`/messages?requestId=${res.data.request._id}`, { replace: true });
                toast.success('Message sent');
            } else {
                const serverMsg = res.data?.message || res.data?.error || 'Failed to send request';
                toast.error(serverMsg);
            }
        } catch (err) {
            console.error('Send request error:', err);
            toast.error('Network error while sending request');
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async () => {
        if (!confirm('Are you sure this item belongs to you? This will freeze the item and notify the finder.')) return;

        setLoading(true);
        try {
            const res = await apiFetch('/api/claim/freeze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ itemId: item._id })
            });

            if (res.ok) {
                const updatedItem = res.data?.item || {};
                toast.success('Item claimed! You can now message the finder.');

                // Propagate updated item to parent
                onSuccess && onSuccess(updatedItem);

                // Try to open the conversation immediately (a ConnectionRequest is auto-created on freeze)
                try {
                    const listRes = await apiFetch('/api/connections/my-requests');
                    if (listRes.ok && Array.isArray(listRes.data)) {
                        const found = listRes.data.find(r => String(r.itemId || '').includes(String(updatedItem._id)) || String(r.itemId) === String(updatedItem._id));
                        if (found) {
                            // Navigate to Messages and open the conversation
                            navigate(`/messages?requestId=${found._id}`);
                        } else {
                            // If not yet present, just navigate to messages list
                            navigate('/messages');
                        }
                    }
                } catch (e) {
                    console.warn('Could not open conversation after claim', e);
                    navigate('/messages');
                }

            } else {
                toast.error(res.data?.error || 'Failed to claim item');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error claiming item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">✕</button>

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-16 h-16 object-cover rounded" />
                        ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">📷</div>
                        )}
                        <div>
                            <h2 className="text-lg font-bold">{item.title}</h2>
                            <p className="text-xs text-gray-500">Found Item</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Reporter Details */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reported By</p>
                            <p className="text-sm font-medium text-gray-900">Roll No: <span className="text-blue-600">{reportedRollNo}</span></p>
                            <p className="text-sm text-gray-600 truncate">Email: {reportedEmail || 'N/A'}</p>
                        </div>

                        {/* STEP 1: Claim Button (If NOT frozen) */}
                        {!isOwnItem && item.status !== 'Frozen' && (
                            <button
                                onClick={handleClaim}
                                disabled={loading}
                                className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition hover:scale-[1.02]"
                            >
                                {item.itemType === 'Found' || item.type === 'Found' || (item._id && String(item._id).startsWith('found'))
                                    ? '✋ This item belongs to me'
                                    : '🔍 I found this item'}
                            </button>
                        )}

                        {/* Status Message if Frozen/Claimed by SOMEONE ELSE */}
                        {item.status === 'Frozen' && !isClaimant && !isOwnItem && (
                            <div className="p-3 bg-yellow-50 text-yellow-800 rounded text-sm text-center font-medium">
                                This item has been claimed by someone else.
                            </div>
                        )}

                        {/* STEP 2: Message Input (Only if Frozen AND (Claimant OR Owner)) */}
                        {item.status === 'Frozen' && (isClaimant || isOwnItem) && (
                            <div className="animate-fade-in-up">
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    {isOwnItem
                                        ? (item.itemType === 'Lost' ? 'Send Message to Finder' : 'Send Message to Claimant')
                                        : (item.itemType === 'Lost' ? 'Send Message to Owner' : 'Send Message to Finder')
                                    }
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Hi — I claimed this item. When can I collect it?"
                                    rows="3"
                                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg flex items-center justify-center font-semibold shadow-sm transition hover:scale-[1.02]"
                                >
                                    {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span> : 'Send Message'}
                                </button>
                            </div>
                        )}

                        {/* If item has been returned/resolved, show a closed message */}
                        {item.status === 'Returned' && (
                            <div className="p-3 bg-gray-50 rounded text-sm text-gray-700 text-center">
                                This item has been marked as returned — messaging for this item is now closed.
                            </div>
                        )}

                        {!item.status === 'Frozen' && <div className="text-center text-xs text-gray-400 mt-2">Verify ownership to continue</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectModal;
