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
        message: '',
        color: '',
        mark: '',
        location: ''
    });

    const isOwnItem = (() => {
        if (!user || !item) return false;
        const possibleUserIds = [user._id, user.uid, user.firebaseUid, user.id].filter(Boolean).map(String);
        return possibleUserIds.includes(String(item.userId));
    })();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        if (!formData.message) return toast.error('Please enter a message');
        if (!formData.color || !formData.mark || !formData.location) return toast.error('Please fill all verification details');

        if (isOwnItem) {
            toast.error('You cannot contact your own item.');
            return;
        }

        setLoading(true);

        // Optimistic draft request so user immediately sees a chat
        const tempId = `temp-${Date.now()}`;
        const senderId = user && (user._id || user.uid || user.firebaseUid) ? (user._id || user.uid || user.firebaseUid) : 'unknown';
        const draftRequest = {
            _id: tempId,
            finderId: item.userId,
            claimantId: senderId,
            itemId: item._id,
            itemTitle: item.title,
            status: 'pending',
            verification: { color: formData.color, mark: formData.mark, location: formData.location },
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
                body: JSON.stringify({ itemId: item._id, verification: draftRequest.verification, templateMessage })
            });

            if (res.ok) {
                // Update URL with real request id so Messages can fetch & replace
                navigate(`/messages?requestId=${res.data.request._id}`, { replace: true });
                toast.success('Message sent');
                onSuccess && onSuccess(res.data.request);
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
                toast.success('Item claimed! usage of messaging enabled.');
                // Proceed to message flow automatically or just update state?
                // User said "then it should show the message option". 
                // Currently message option is already visible. 
                // We will just proceed to send the message if they typed one, or just let them type now.
                // But let's trigger the message send logic if they have content?
                // Or maybe just refresh the item status?
                // For now, let's keep the modal open but maybe disable the claim button (since it's now frozen).
                // Actually, let's just let them send the message now.
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
                    <div className="flex items-center gap-4 mb-4">
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-16 h-16 object-cover rounded" />
                        ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">📷</div>
                        )}
                        <div>
                            <h2 className="text-lg font-bold">{item.title}</h2>
                            <p className="text-xs text-gray-500">Message the finder about this item</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Claim Button */}
                        {!isOwnItem && (
                            <button
                                onClick={handleClaim}
                                disabled={loading || item.status === 'Frozen'}
                                className={`w-full py-2.5 rounded-lg font-bold text-white mb-2 transition 
                             ${item.status === 'Frozen' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {item.status === 'Frozen' ? 'Item Frozen (Claimed)' : '✋ This item belongs to me'}
                            </button>
                        )}

                        <div>
                            <label className="text-sm font-medium text-gray-700">Item Color</label>
                            <input name="color" value={formData.color} onChange={handleChange} placeholder="e.g. Red" className="w-full border rounded-lg p-2.5 mt-1" />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Unique Mark / Description</label>
                            <textarea name="mark" value={formData.mark} onChange={handleChange} placeholder="e.g. Scratch on back" rows="2" className="w-full border rounded-lg p-2.5 mt-1" />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Lost Location (Approx)</label>
                            <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Library 2nd Floor" className="w-full border rounded-lg p-2.5 mt-1" />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Message</label>
                            <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Hi — I believe this is mine. I can verify ownership..." rows="3" className="w-full border rounded-lg p-2.5 mt-1" />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg">Cancel</button>
                            <button onClick={handleSubmit} disabled={loading || isOwnItem} className="w-2/3 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center">
                                {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span> : 'Send Message'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectModal;
