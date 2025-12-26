import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

const Messages = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        // If coming from ConnectModal with a draft request, add it immediately
        if (location.state && location.state.draftRequest) {
            const draft = location.state.draftRequest;
            setRequests(prev => {
                if (prev.find(r => r._id === draft._id)) return prev;
                return [draft, ...prev];
            });
            setSelectedRequest(draft);
            // clear state so refresh won't keep reapplying
            navigate(location.pathname, { replace: true, state: {} });
            setLoading(false);
            // Also kick off a background refresh to pick up the real request if it was created
            fetchRequests();
            return;
        }

        // If URL has requestId param, fetch and select
        const params = new URLSearchParams(location.search);
        const requestId = params.get('requestId');

        fetchRequests(requestId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchRequests = async (selectRequestId) => {
        try {
            const res = await apiFetch('/api/connections/my-requests');
            if (res.ok) {
                setRequests(res.data);
                if (selectRequestId) {
                    const found = res.data.find(r => String(r._id) === String(selectRequestId));
                    if (found) {
                        setSelectedRequest(found);
                        // If there are optimistic messages queued (from draft), flush them
                        setTimeout(() => flushOptimisticMessages(found), 0);
                    }
                } else if (!selectedRequest && res.data.length > 0) {
                    setSelectedRequest(res.data[0]);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Replace temp draft request with real one when possible (e.g. after ConnectModal completes)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const requestId = params.get('requestId');
        if (requestId) {
            // Refresh requests and select the real requestId
            fetchRequests(requestId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    const flushOptimisticMessages = async (realRequest) => {
        // Find optimistic messages and send them in order
        const pending = (realRequest.messages || []).filter(m => m._optimistic && !m._sent);
        if (!pending.length) return realRequest;

        let latest = realRequest;
        for (const m of pending) {
            try {
                const res = await apiFetch(`/api/connections/${latest._id}/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: m.text })
                });
                if (res.ok) {
                    latest = res.data;
                    setRequests(prev => prev.map(r => r._id === latest._id ? latest : r));
                    setSelectedRequest(latest);
                } else {
                    m._failed = true;
                    setSelectedRequest(prev => ({ ...prev }));
                    toast.error(res.data?.message || res.data?.error || 'Failed to deliver message');
                }
            } catch (err) {
                console.error('Flush message error:', err);
                m._failed = true;
                setSelectedRequest(prev => ({ ...prev }));
                toast.error('Network error while delivering message');
            }
        }
        return latest;
    };

    const handleSendMessage = async () => {
        if (!newMessage || !selectedRequest) return;

        // Optimistic UI update: append message locally immediately
        const senderId = user && (user._id || user.uid || user.firebaseUid) ? (user._id || user.uid || user.firebaseUid) : 'unknown';
        const optimisticMsg = { senderId, text: newMessage, timestamp: new Date().toISOString(), _optimistic: true };

        setSelectedRequest(prev => {
            const copy = { ...prev };
            copy.messages = [...(copy.messages || []), optimisticMsg];
            copy.updatedAt = new Date().toISOString();
            return copy;
        });

        setRequests(prev => prev.map(r => r._id === selectedRequest._id ? { ...r, messages: [...(r.messages || []), optimisticMsg], updatedAt: new Date().toISOString() } : r));
        setNewMessage('');
        setSending(true);

        try {
            // If this is a draft (temp id), we just queue locally and wait for real id
            if (String(selectedRequest._id || '').startsWith('temp-')) {
                // leave optimistic message; it will be flushed once real request is available
                toast.success('Message queued and will be delivered once conversation is created');
            } else {
                const res = await apiFetch(`/api/connections/${selectedRequest._id}/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: optimisticMsg.text })
                });

                if (res.ok) {
                    // Replace request with server response
                    const updatedReq = res.data;
                    setSelectedRequest(updatedReq);
                    setRequests(prev => prev.map(r => r._id === updatedReq._id ? updatedReq : r));
                } else {
                    toast.error(res.data?.message || res.data?.error || 'Failed to send message');
                    // mark the last optimistic message as failed
                    setSelectedRequest(prev => {
                        const copy = { ...prev };
                        if (copy.messages?.length) copy.messages[copy.messages.length - 1]._failed = true;
                        return copy;
                    });
                }
            }
        } catch (err) {
            console.error('Message send error:', err);
            toast.error('Network error while sending message');
            setSelectedRequest(prev => {
                const copy = { ...prev };
                if (copy.messages?.length) copy.messages[copy.messages.length - 1]._failed = true;
                return copy;
            });
        } finally {
            setSending(false);
        }
    };

    const isMe = (senderId) => {
        const myIds = [user && (user._id || user.uid || user.firebaseUid)].filter(Boolean).map(String);
        return myIds.includes(String(senderId));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1 max-w-7xl mx-auto w-full p-4 grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Request List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden md:col-span-1 border border-gray-100 h-[calc(100vh-100px)]">
                    <div className="p-4 border-b bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                    </div>
                    <div className="overflow-y-auto h-full pb-20">
                        {loading ? (
                            <p className="p-4 text-gray-500">Loading...</p>
                        ) : requests.length === 0 ? (
                            <p className="p-4 text-gray-500 text-center mt-10">No messages yet.</p>
                        ) : (
                            requests.map(req => (
                                <div
                                    key={req._id}
                                    onClick={() => setSelectedRequest(req)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedRequest?._id === req._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-gray-900 truncate pr-2">{req.itemTitle}</h3>
                                        {req.status && req.status !== 'pending' && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${req.status === 'accepted' ? 'bg-green-100 text-green-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {req.status}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {req.messages[req.messages.length - 1]?.text}
                                    </p>
                                    <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
                                        <span>{format(new Date(req.updatedAt), 'MMM d, h:mm a')}</span>
                                        {String(req.finderId) === String(user && (user._id || user.uid || user.firebaseUid)) && <span className="bg-purple-100 text-purple-600 px-1.5 rounded">You Found It</span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat / Detail View */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden md:col-span-2 border border-gray-100 h-[calc(100vh-100px)] flex flex-col">
                    {selectedRequest ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-lg text-gray-800">{selectedRequest.itemTitle}</h2>
                                    <p className="text-xs text-gray-500">Private conversation about this item</p>
                                </div>
                            </div>

                            {/* Compact Verification Info */}
                            <div className="p-4 border-b bg-gray-50 text-sm flex gap-4 items-center">
                                <div className="flex-1 text-sm text-gray-700">
                                    <div className="font-medium">🔒 Verification</div>
                                    <div className="text-xs text-gray-500">{selectedRequest.verification.color} · {selectedRequest.verification.location} · {selectedRequest.verification.mark}</div>
                                </div>
                                <div className="text-xs text-gray-500">{format(new Date(selectedRequest.updatedAt), 'MMM d, h:mm a')}</div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
                                {(selectedRequest.messages || []).map((msg, idx) => {
                                    const me = isMe(msg.senderId);
                                    return (
                                        <div key={idx} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${me ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                                                <p>{msg.text}</p>
                                                <div className="flex items-center gap-2 mt-1 text-[10px]">
                                                    <span className={me ? 'text-blue-200' : 'text-gray-400'}>{format(new Date(msg.timestamp), 'h:mm a')}</span>
                                                    {msg._optimistic && <span className="text-xs text-gray-400">• sending</span>}
                                                    {msg._failed && <span className="text-xs text-red-400">• failed</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Input Area - Free text + Send */}
                            <div className="p-4 bg-white border-t flex items-center gap-3">
                                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." className="flex-1 border rounded-full px-4 py-2" />
                                <button onClick={handleSendMessage} disabled={!newMessage || sending} className="bg-blue-600 text-white px-4 py-2 rounded-full">{sending ? 'Sending...' : 'Send'}</button>
                            </div>

                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Select a conversation to start messaging
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Messages;
