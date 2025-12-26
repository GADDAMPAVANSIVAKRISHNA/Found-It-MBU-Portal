import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { toast } from 'react-hot-toast';

const ActionPopup = () => {
    const [actions, setActions] = useState({ confirmReturn: [], confirmReceipt: [] });
    const [loading, setLoading] = useState(false);

    const fetchActions = async () => {
        try {
            const res = await apiFetch('/api/claim/pending-actions');
            if (res.ok) {
                setActions(res.data.actions || { confirmReturn: [], confirmReceipt: [] });
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchActions();
        const interval = setInterval(fetchActions, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const handleConfirm = async (type, itemId) => {
        setLoading(true);
        try {
            const endpoint = type === 'confirm_return' ? '/api/claim/confirm-return' : '/api/claim/confirm-receipt';
            const res = await apiFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId })
            });

            if (res.ok) {
                toast.success('Confirmed successfully!');
                fetchActions(); // Refresh to remove popup
            } else {
                toast.error('Failed to confirm');
            }
        } catch (err) {
            toast.error('Error confirming action');
        } finally {
            setLoading(false);
        }
    };

    // Render logic: Show one popup at a time
    const activeReturn = actions.confirmReturn[0]; // Finder needs to confirm
    const activeReceipt = actions.confirmReceipt[0]; // Claimant needs to confirm

    if (!activeReturn && !activeReceipt) return null;

    const currentItem = activeReturn || activeReceipt;
    const isFinder = !!activeReturn;

    // Text logic
    const message = isFinder
        ? `Did you return "${currentItem.title}" to ${currentItem.claimantName}?`
        : `Did you receive "${currentItem.title}" from ${currentItem.finderName} and claim it?`;

    return (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-white border border-green-500 shadow-2xl rounded-xl p-6 z-[100] max-w-sm animate-bounce-in">
            <h3 className="font-bold text-lg text-gray-800 mb-2">Wait! Action Required</h3>
            <p className="text-gray-600 mb-4">{message}</p>

            <div className="flex gap-3">
                <button
                    onClick={() => handleConfirm(currentItem.type, currentItem.id)}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg"
                >
                    Yes, I did
                </button>
                <button
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg"
                    onClick={() => {/* Optionally snooze? For now just do nothing or close for session? User wants "always should come" */ }}
                >
                    Not Yet
                </button>
            </div>
        </div>
    );
};

export default ActionPopup;
