import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { toast } from 'react-hot-toast';

const ActionPopup = () => {
    const [actions, setActions] = useState({ confirmReturn: [], confirmReceipt: [] });
    const [visible, setVisible] = useState(true);
    const popupRef = React.useRef(null);

    const getLocalDismissed = () => {
        try {
            return JSON.parse(localStorage.getItem('dismissedModals') || '[]');
        } catch (_) { return []; }
    };
    const getLocalDontAsk = () => {
        try {
            return JSON.parse(localStorage.getItem('dontAskModals') || '[]');
        } catch (_) { return []; }
    };

    const fetchActions = async () => {
        try {
            const res = await apiFetch('/api/claim/pending-actions');
            if (res.ok) {
                const data = res.data.actions || { confirmReturn: [], confirmReceipt: [] };
                // Filter out items dismissed in this session or persisted with 'dont_ask_again'
                const dismissed = getLocalDismissed();
                const dontAsk = getLocalDontAsk();

                const filtered = {
                    confirmReturn: data.confirmReturn.filter(i => !dismissed.includes(i.id) && !dontAsk.includes(i.id)),
                    confirmReceipt: data.confirmReceipt.filter(i => !dismissed.includes(i.id) && !dontAsk.includes(i.id))
                };

                setActions(filtered);
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

    useEffect(() => {
        const onDocClick = (e) => {
            if (!popupRef.current) return;
            if (!popupRef.current.contains(e.target)) {
                // Close popup when clicking outside
                setVisible(false);
            }
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    const sendPromptResponse = async (itemId, actionType, response) => {
        try {
            await apiFetch('/api/claim/prompt-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, actionType, response })
            });
        } catch (err) {
            console.error('Failed to persist prompt response:', err);
        }
    };

    const handleConfirm = (type, itemId) => {
        // OPTIMISTIC UPDATE: Remove instantly from UI
        setActions(prev => {
            const newReturn = prev.confirmReturn.filter(i => i.id !== itemId);
            const newReceipt = prev.confirmReceipt.filter(i => i.id !== itemId);
            return { confirmReturn: newReturn, confirmReceipt: newReceipt };
        });

        // Current item for API call
        const endpoint = type === 'confirm_return' ? '/api/claim/confirm-return' : '/api/claim/confirm-receipt';

        // Background API call
        apiFetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId })
        }).then(res => {
            if (res.ok) {
                toast.success('Confirmed successfully!');
                // Persist response so it no longer shows later
                sendPromptResponse(itemId, type, 'confirmed');
                fetchActions(); // Sync state
            } else {
                toast.error('Failed to confirm action');
                fetchActions(); // Revert/Sync on error
            }
        }).catch(() => {
            toast.error('Network error confirming action');
        });
    };

    const handleDismiss = (itemId) => {
        // Hide for the session and persist 'dismissed' locally
        const dismissed = getLocalDismissed();
        if (!dismissed.includes(itemId)) {
            dismissed.push(itemId);
            localStorage.setItem('dismissedModals', JSON.stringify(dismissed));
        }
        setActions(prev => {
            const newReturn = prev.confirmReturn.filter(i => i.id !== itemId);
            const newReceipt = prev.confirmReceipt.filter(i => i.id !== itemId);
            return { confirmReturn: newReturn, confirmReceipt: newReceipt };
        });
    };

    const handleDontAsk = async (itemId, type) => {
        // Persist in backend and locally
        const dontAsk = getLocalDontAsk();
        if (!dontAsk.includes(itemId)) {
            dontAsk.push(itemId);
            localStorage.setItem('dontAskModals', JSON.stringify(dontAsk));
        }
        await sendPromptResponse(itemId, type, 'dont_ask_again');
        setActions(prev => {
            const newReturn = prev.confirmReturn.filter(i => i.id !== itemId);
            const newReceipt = prev.confirmReceipt.filter(i => i.id !== itemId);
            return { confirmReturn: newReturn, confirmReceipt: newReceipt };
        });
    };

    // Render logic: Show one popup at a time
    const activeReturn = actions.confirmReturn[0];
    const activeReceipt = actions.confirmReceipt[0];

    if (!activeReturn && !activeReceipt) return null;

    const currentItem = activeReturn || activeReceipt;
    const isFinder = !!activeReturn;

    const message = isFinder
        ? `Did you return "${currentItem.title}" to ${currentItem.claimantName}?`
        : `Did you receive "${currentItem.title}" from ${currentItem.finderName} and claim it?`;

    if (!visible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-fade-in-up" ref={popupRef}>
            <div className="relative group max-w-sm w-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 overflow-hidden transition-all hover:scale-[1.02]">
                {/* Gradient Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

                <div className="relative">
                    <button aria-label="Close" className="absolute right-3 top-3 text-gray-600 hover:text-gray-900" onClick={() => setVisible(false)}>✕</button>

                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <h3 className="font-bold text-gray-800 text-lg tracking-tight">Action Required</h3>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed mb-4 font-medium">
                        {message}
                    </p>

                    <div className="flex gap-3 mb-2">
                        <button
                            onClick={() => handleConfirm(currentItem.type, currentItem.id)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transform transition active:scale-95"
                        >
                            Yes, I did
                        </button>
                        <button
                            onClick={() => handleDismiss(currentItem.id)}
                            className="flex-1 bg-gray-100/50 hover:bg-gray-100 text-gray-700 text-sm font-bold py-2.5 rounded-xl border border-gray-200 backdrop-blur-sm transition active:scale-95"
                        >
                            Not Yet
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => handleDontAsk(currentItem.id, currentItem.type)}
                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                      >
                        Don't ask again
                      </button>
                      <div className="text-xs text-gray-400">You can change this later in Preferences</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActionPopup;
