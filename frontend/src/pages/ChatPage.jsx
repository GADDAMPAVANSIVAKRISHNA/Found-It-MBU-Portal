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

        // Optimistically populate sender for immediate local display
        // This ensures 'isMe' calculation works even if backend returns only ID
        if (savedMsg.sender && typeof savedMsg.sender !== 'object') {
          savedMsg.sender = {
            _id: savedMsg.sender,
            email: user.email,
            name: user.displayName || user.name || 'Me'
          };
        }

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
    // Try to match by excluding the current user by email (most robust) or ID
    return chat.participants.find(p => {
      const pId = typeof p === 'object' ? p._id : p;
      const pEmail = typeof p === 'object' ? p.email : '';

      if (user.email && pEmail) return pEmail !== user.email;

      const currentUserId = user._id || user.uid || user.id;
      return String(pId) !== String(currentUserId);
    });
  };



  if (loading) return <div className="p-8 text-center">Loading chat...</div>;

  const otherUser = getOtherUser();
  const isOwner = chat?.item?.userId === user?._id;
  const otherUserRollNumber = otherUser?.email?.split('@')[0];

  const isSameDay = (d1, d2) => {
    return new Date(d1).toDateString() === new Date(d2).toDateString();
  };

  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#efeae2] relative">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}></div>
      {/* Header */}
      <div className="bg-[#f0f2f5] px-4 py-3 shadow-sm flex items-center justify-between z-10 sticky top-0 h-16 border-b border-[#d1d7db]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/gallery')} className="text-[#54656f] hover:text-black">
            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" className="" version="1.1" x="0px" y="0px" enableBackground="new 0 0 24 24"><title>back</title><path fill="currentColor" d="M12,4l1.4,1.4L7.8,11H20v2H7.8l5.6,5.6L12,20l-8-8L12,4z"></path></svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#dfe3e5] rounded-full overflow-hidden flex items-center justify-center text-[#fff]">
              <svg viewBox="0 0 212 212" height="24" width="24" fill="#aebac1"><path d="M106.251,0C47.568,0,0,47.568,0,106.251c0,58.682,47.568,106.251,106.251,106.251 c58.682,0,106.251-47.569,106.251-106.251C212.502,47.568,164.932,0,106.251,0z M106.251,32.261 c18.784,0,34.027,15.243,34.027,34.027S125.035,100.315,106.251,100.315c-18.784,0-34.027-15.243-34.027-34.027 S87.467,32.261,106.251,32.261z M106.251,179.99c-30.825,0-58.337-14.331-75.761-36.637c0.887-24.819,25.485-44.576,75.761-44.576 c50.223,0,74.767,19.646,75.756,44.389C164.516,165.578,137.039,179.99,106.251,179.99z" /></svg>
            </div>
            <div>
              <h2 className="font-medium text-[#111b21] line-clamp-1 text-base">{otherUserRollNumber || otherUser?.name || 'User'}</h2>
              {isOwner ? (
                <p className="text-xs text-[#667781]">This item belongs to you</p>
              ) : (
                <p className="text-xs text-[#667781] line-clamp-1">{chat?.item?.title}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">

          {chat?.item?.status === 'Frozen' && (
            <span className={`text-xs px-2 py-1 rounded font-medium ${chat.item.claimedBy === user?._id
              ? 'bg-[#00a884] text-[#111b21]'
              : 'bg-[#ffc107] text-[#111b21]'
              }`}>
              {chat.item.claimedBy === user?._id ? 'You Claimed This' : 'Under Review'}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-transparent relative z-10 scrollbar-hide"
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
              display: none;
          }
          .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
          }
        `}</style>

        {messages.map((msg, i) => {
          // Robust checking for sender comparison using Email and ID
          let isMe = false;
          const currentUserId = user._id || user.uid || user.id;
          const currentUserEmail = user.email ? user.email.toLowerCase() : '';

          if (msg.sender) {
            if (typeof msg.sender === 'object') {
              const senderEmail = msg.sender.email ? msg.sender.email.toLowerCase() : '';
              // Check email first (most reliable across providers)
              if (senderEmail && currentUserEmail && senderEmail === currentUserEmail) {
                isMe = true;
              }
              // Check ID if email match failed or not possible
              else {
                const senderId = msg.sender._id || msg.sender.id;
                if (senderId && String(senderId) === String(currentUserId)) {
                  isMe = true;
                }
              }
            } else {
              // Fallback to ID check if sender is just a string
              if (String(msg.sender) === String(currentUserId)) {
                isMe = true;
              }
            }
          }

          // Check if read by other user
          const isRead = msg.readBy && msg.readBy.length > 0 && !msg.readBy.every(id => String(id) === String(user._id));

          // Date Separator Logic
          const showDateSeparator = i === 0 || !isSameDay(messages[i - 1].createdAt, msg.createdAt);

          return (
            <React.Fragment key={msg._id || i}>
              {showDateSeparator && (
                <div className="flex justify-center my-4 sticky top-2 z-10">
                  <span className="bg-[#e5ddd5] text-[#556066] text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm uppercase">
                    {formatDateSeparator(msg.createdAt)}
                  </span>
                </div>
              )}
              <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 relative z-10`}>
                <div
                  className={`px-2 py-1.5 rounded-lg shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] max-w-[85%] sm:max-w-[70%] relative text-sm ${isMe
                    ? 'bg-[#d9fdd3] rounded-tr-none text-[#111b21] text-right'
                    : 'bg-white rounded-tl-none text-[#111b21] text-left'
                    }`}
                >
                  <p className="break-words pr-2 whitespace-pre-wrap leading-tight">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-0.5 select-none text-[11px] ${isMe ? 'text-[#667781] justify-end' : 'text-[#667781] justify-end'}`}>
                    <span className="opacity-80">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}
                    </span>
                    {isMe && (
                      <span className={`${isRead ? 'text-[#53bdeb]' : 'text-[#8696a0]'}`}>
                        <svg viewBox="0 0 16 11" height="11" width="16" preserveAspectRatio="xMidYMid meet" className="" version="1.1" x="0px" y="0px" enableBackground="new 0 0 16 11" fill="currentColor"><path id="all-checks" d="M11.5 0L5.6 7.6 2.6 4 1.4 5.2 5.5 10.7 12.6 1.3 11.5 0ZM16 0L10.1 7.6 9.2 6.5 14.9 1.3 16 0ZM6.6 5.8L7.6 7.1 8 6.5 7.1 5.3 6.6 5.8Z"></path></svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#f0f2f5] px-4 py-3 sticky bottom-0 flex items-end gap-2 z-20 w-full min-h-[60px]">
        <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-2 shadow-sm border border-transparent focus-within:border-white">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            placeholder="Type a message"
            rows="1"
            className="w-full focus:outline-none text-[#111b21] bg-transparent resize-none max-h-32 overflow-y-auto placeholder-[#667781]"
            style={{ minHeight: '24px' }}
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="bg-[#00a884] text-white p-2.5 rounded-full hover:bg-[#008f6f] transition disabled:opacity-50 shadow-md flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12"
        >
          <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" className="" version="1.1" x="0px" y="0px" enableBackground="new 0 0 24 24"><path fill="currentColor" d="M1.101,21.757L23.8,12.028L1.101,2.3l0.011,7.912l13.623,1.816L1.112,13.845 L1.101,21.757z"></path></svg>
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
