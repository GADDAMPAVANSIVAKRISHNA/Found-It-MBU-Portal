import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';

const ChatPage = () => {
  const { chatId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user || !token) return;

    // Connect Socket
    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(BACKEND_URL, {
      auth: { token: token }
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('chat:new_message', (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => {
          if (prev.find(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        scrollToBottom();
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user, token, chatId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('ChatPage: Fetching data...');
        const [chatRes, msgsRes] = await Promise.all([
          apiFetch(`/api/chats/${chatId}`),
          apiFetch(`/api/messages/${chatId}`)
        ]);
        console.log('ChatPage: Responses received', { chatRes, msgsRes });

        if (chatRes.ok) setChat(chatRes.data.chat);
        else throw new Error(chatRes.data?.error || 'Failed to load chat');

        if (msgsRes.ok) setMessages(msgsRes.data.messages);
        else throw new Error(msgsRes.data?.error || 'Failed to load messages');

        // Scroll to bottom after loading
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error(err);
        toast.error(err.message);
        navigate('/gallery');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      console.log('ChatPage: Starting fetch for chatId:', chatId);
      fetchData();
    } else {
      console.log('ChatPage: User is null, waiting...');
    }
  }, [chatId, navigate, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await apiFetch(`/api/messages/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage })
      });

      if (res.ok) {
        setNewMessage('');
        const savedMsg = res.data.message;
        setMessages(prev => {
          if (prev.find(m => m._id === savedMsg._id)) return prev;
          return [...prev, savedMsg];
        });
      } else {
        toast.error('Failed to send');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error sending message');
    }
  };

  const getOtherUser = () => {
    if (!chat || !user) return null;
    return chat.participants.find(p => p._id !== user._id && p._id !== user.uid && p._id !== user.id);
  };

  const handleClaim = async () => {
    if (!chat?.item?._id) return;
    if (!confirm('Are you sure this item belongs to you? This will freeze the item and notify the finder.')) return;

    try {
      const res = await apiFetch('/api/claim/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: chat.item._id })
      });

      if (res.ok) {
        toast.success('Item claimed successfully!');
        // Update local chat item status
        setChat(prev => ({
          ...prev,
          item: { ...prev.item, status: 'Frozen', claimedBy: user._id }
        }));
      } else {
        toast.error(res.data?.error || 'Failed to claim item');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error claiming item');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading chat...</div>;

  const otherUser = getOtherUser();
  const isOwner = chat?.item?.userId === user?._id;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/gallery')} className="text-gray-600 hover:text-gray-900 mr-2">
            ← Back
          </button>
          <div>
            <h2 className="font-bold text-lg line-clamp-1">{chat?.item?.title || 'Item Chat'}</h2>
            <p className="text-sm text-gray-500">{otherUser?.name || 'User'}</p>
          </div>
        </div>

        {/* Actions */}
        <div>
          {/* Show Claim button if: Found Item, Not Owner, Not Frozen */}
          {chat?.itemModel === 'FoundItem' && chat?.item?.status !== 'Frozen' && !isOwner && (
            <button
              onClick={handleClaim}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow transition"
            >
              ✋ Claim Item
            </button>
          )}
          {/* Show Status if Frozen */}
          {chat?.item?.status === 'Frozen' && (
            <span className={`text-xs px-2 py-1 rounded border ${chat.item.claimedBy === user?._id
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
              {chat.item.claimedBy === user?._id ? 'Claimed by You' : 'Item Under Review'}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => {
          const isMe = msg.sender._id === user._id || msg.sender === user._id;
          // Check if read by other user (simplified check)
          const isRead = msg.readBy && msg.readBy.length > 0 && !msg.readBy.every(id => id === msg.sender._id);

          return (
            <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
              <div className={`max-w-[70%] px-3 py-2 rounded-lg shadow-sm relative ${isMe ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                }`}>
                <p className="text-sm break-words pr-4">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1 select-none">
                  <span className="text-[10px] text-gray-500 min-w-fit">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    <span className={`text-[10px] ${isRead ? 'text-blue-500' : 'text-gray-400'}`}>
                      {isRead ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#f0f2f5] p-3 px-4 border-t sticky bottom-0 flex items-center gap-2">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition disabled:opacity-50 w-10 h-10 flex items-center justify-center"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
