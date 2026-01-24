import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ConnectModal = ({ item, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const { token, user } = useAuth();
    const navigate = useNavigate();

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

    // Extract Reporter Info
    const reportedEmail = item.userEmail || item.email || '';
    const reportedRollNo = item.rollNumber || (reportedEmail.includes('@') ? reportedEmail.split('@')[0] : 'N/A');

    // START of new logic: store connectionRequestId here
    const [connectionRequestId, setConnectionRequestId] = useState(null);
    const [chatId, setChatId] = useState(null);

    const handleOpenChat = async () => {
        setLoading(true);
        try {
            // Priority 0: Modern Chat ID (from freeze or existing)
            let targetChatId = chatId;

            // If we don't have a chatId yet, try to create/find one immediately
            if (!targetChatId) {
                try {
                    const chatRes = await apiFetch('/api/chats', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            itemId: item._id,
                            ownerId: item.userId,
                            itemType: item.itemType
                        })
                    });
                    if (chatRes.ok) {
                        targetChatId = chatRes.data.chat._id;
                        setChatId(targetChatId); // Update state for future clicks
                    }
                } catch (e) { console.error('Auto-create chat failed', e); }
            }

            if (targetChatId) {
                navigate(`/chat/${targetChatId}`);
                onClose && onClose();
                return;
            }

            // Priority 1: Use the connectionRequestId (Legacy/Fallback)
            if (connectionRequestId) {
                navigate(`/messages?requestId=${connectionRequestId}`);
                onClose && onClose();
                return;
            }

            // Priority 2: Fetch my connection requests to find the one for this item
            const listRes = await apiFetch('/api/connections/my-requests');
            if (listRes.ok && Array.isArray(listRes.data)) {
                // Find request for this item
                const found = listRes.data.find(r =>
                    String(r.itemId || '').includes(String(item._id)) ||
                    String(r.itemId) === String(item._id)
                );

                if (found) {
                    navigate(`/messages?requestId=${found._id}`);
                    onClose && onClose();
                } else {
                    toast.error('Chat could not be started. Please try again or check your messages.');
                    navigate('/messages');
                }
            } else {
                toast.error('Could not fetch connection details.');
            }
        } catch (err) {
            console.error('Error opening chat:', err);
            toast.error('Failed to open chat.');
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
                const connId = res.data?.connectionRequestId;
                const newChatId = res.data?.chatId;

                if (connId) setConnectionRequestId(connId);
                if (newChatId) setChatId(newChatId);

                toast.success('Item claimed! You can now message the finder.');

                // Propagate updated item to parent
                if (onSuccess) onSuccess(updatedItem);
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

                        {/* STEP 2: Message Button (Only if Frozen AND (Claimant OR Owner)) */}
                        {item.status === 'Frozen' && (isClaimant || isOwnItem) && (
                            <div className="animate-fade-in-up">
                                <p className="text-sm text-center text-green-600 font-medium mb-3">
                                    Item claimed successfully! You can now message the {isOwnItem ? 'claimant' : (item.itemType === 'Lost' ? 'owner' : 'finder')} to coordinate return.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3 rounded-lg font-bold text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleOpenChat}
                                        disabled={loading}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center font-bold shadow-md transition hover:scale-[1.02]"
                                    >
                                        💬 Chat
                                    </button>
                                </div>
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
