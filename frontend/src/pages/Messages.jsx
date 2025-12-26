import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const MESSAGE_TEMPLATES = [
    "This item belongs to me",
    "I can verify ownership",
    "Please review my claim",
    "Requesting to connect regarding this item"
];

const Messages = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await apiFetch('/api/connections/my-requests');
            if (res.ok) {
                setRequests(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handeRespond = async (action) => {
        if (!selectedRequest) return;
        try {
            const res = await apiFetch(`/api/connections/${selectedRequest._id}/respond`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            if (res.ok) {
                toast.success(`Request ${action}ed`);
                setRequests(requests.map(r => r._id === selectedRequest._id ? { ...r, status: action + 'ed' } : r));
                setSelectedRequest({ ...selectedRequest, status: action + 'ed' });
                // Refresh to get full updates if needed
                fetchRequests();
            }
        } catch (error) {
            toast.error("Action failed");
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage) return;
        setSending(true);
        try {
            const res = await apiFetch(`/api/connections/${selectedRequest._id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newMessage })
            });

            if (res.ok) {
                // Optimistically update
                const updatedReq = res.data;
                setSelectedRequest(updatedReq);
                setRequests(requests.map(r => r._id === updatedReq._id ? updatedReq : r));
                setNewMessage('');
            } else {
                toast.error("Failed to send message");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    const isFinder = selectedRequest ? selectedRequest.finderId === user?.uid : false;

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
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${req.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                            req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {req.messages[req.messages.length - 1]?.text}
                                    </p>
                                    <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
                                        <span>{format(new Date(req.updatedAt), 'MMM d, h:mm a')}</span>
                                        {req.finderId === user?.uid && <span className="bg-purple-100 text-purple-600 px-1.5 rounded">You Found It</span>}
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
                                    <p className="text-xs text-gray-500">
                                        Request Status: <span className="capitalize font-medium">{selectedRequest.status}</span>
                                    </p>
                                </div>
                                {isFinder && selectedRequest.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handeRespond('reject')} className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">Reject</button>
                                        <button onClick={() => handeRespond('accept')} className="px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg">Accept</button>
                                    </div>
                                )}
                            </div>

                            {/* Verification Info (Visible to Finder or Both?) */}
                            <div className="p-4 bg-yellow-50 border-b border-yellow-100 text-sm">
                                <p className="font-semibold text-yellow-800 mb-1">🔒 Verification Details</p>
                                <div className="grid grid-cols-3 gap-2 text-yellow-900">
                                    <div><span className="text-yellow-700 text-xs uppercase">Color:</span> {selectedRequest.verification.color}</div>
                                    <div><span className="text-yellow-700 text-xs uppercase">Location:</span> {selectedRequest.verification.location}</div>
                                    <div className="col-span-3"><span className="text-yellow-700 text-xs uppercase">Mark:</span> {selectedRequest.verification.mark}</div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
                                {selectedRequest.messages.map((msg, idx) => {
                                    const isMe = msg.senderId === user?.uid;
                                    return (
                                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                                                }`}>
                                                <p>{msg.text}</p>
                                                <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {format(new Date(msg.timestamp), 'h:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Input Area (Only Templates allowed per requirements, unless overridden?) 
                  "Chat must not be public... No free-text typing is allowed"
                  The user request said "Chat UI after acceptance" AND "No free-text typing is allowed".
                  So I will enforce templates even in chat for now.
              */}
                            {selectedRequest.status === 'accepted' ? (
                                <div className="p-4 bg-white border-t">
                                    <p className="text-xs text-gray-500 mb-2">Select a message to send:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {MESSAGE_TEMPLATES.map((tmpl, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setNewMessage(tmpl)}
                                                className={`text-xs px-3 py-2 rounded-full border transition-colors ${newMessage === tmpl ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {tmpl}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage || sending}
                                        className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                                    >
                                        {sending ? 'Sending...' : 'Send Message'}
                                    </button>
                                </div>
                            ) : selectedRequest.status === 'rejected' ? (
                                <div className="p-4 bg-gray-50 border-t text-center text-gray-500 text-sm">
                                    This connection has been closed.
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 border-t text-center text-gray-500 text-sm">
                                    Waiting for finder to accept...
                                </div>
                            )}

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
