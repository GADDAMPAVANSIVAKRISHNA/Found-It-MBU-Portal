import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MessagesList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await apiFetch('/api/chats');
        if (res.ok) {
          setChats(res.data.chats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchChats();
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading messages...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {chats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No conversations yet.</div>
        ) : (
          chats.map(chat => {
            const otherUser = chat.participants.find(p => p._id !== user._id);
            return (
              <Link to={`/chat/${chat._id}`} key={chat._id} className="block hover:bg-gray-50 transition border-b last:border-b-0 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">{chat.item?.title || 'Item'}</h3>
                    <p className="text-sm text-gray-600">{otherUser?.email?.split('@')[0] || otherUser?.name || 'User'}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MessagesList;
