// import { useEffect, useState } from 'react';
// import api from '../utils/api';
// import { supabase } from '../lib/supabaseClient';

// const NotificationsBell = () => {
//   const [open, setOpen] = useState(false);
//   const [notes, setNotes] = useState([]);

//   const load = async () => {
//     const u = (await supabase.auth.getUser()).data.user;
//     if (!u) return;
//     const { data } = await api.get('/api/notifications/unread', { params: { userId: u.id } });
//     setNotes(data.notifications || []);
//   };

//   useEffect(() => { load(); }, []);

//   const markRead = async (id) => {
//     await api.post(`/api/notifications/${id}/read`);
//     setNotes(prev => prev.filter(n => n._id !== id));
//   };

//   return (
//     <div className="relative">
//       <button aria-label="Notifications" className="relative" onClick={() => setOpen(!open)}>
//         <span>🔔</span>
//         {notes.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded">{notes.length}</span>}
//       </button>
//       {open && (
//         <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg p-3 z-50">
//           <div className="font-bold mb-2">Notifications</div>
//           {notes.length === 0 && <div className="text-sm text-gray-600">No new notifications</div>}
//           {notes.map(n => (
//             <div key={n._id} className="border-b last:border-none py-2">
//               <div className="text-sm font-semibold">{n.title}</div>
//               <div className="text-xs text-gray-600">{n.message}</div>
//               <button className="text-xs text-primary mt-1" onClick={() => markRead(n._id)}>Mark as read</button>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotificationsBell;



import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, BASE_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
// `socket.io-client` is imported dynamically at runtime to avoid build-time failures when the
// package isn't installed during initial development. A polling fallback keeps counts updated.

const relativeTime = (d) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
};

const NotificationsBell = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  const loadUnread = async () => {
    try {
      const res = await apiFetch('/api/notifications/unread-count');
      if (res.ok) setUnread(res.data.count || 0);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRecent = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/notifications?limit=10');
      if (!res.ok) return;
      setNotes(res.data.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadUnread();
    const t = setInterval(loadUnread, 15000);
    return () => clearInterval(t);
  }, [user]);

  // Setup Socket.IO connection
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      if (!user || socketRef.current) return;
      try {
        // Try to dynamically import socket.io-client at runtime — avoids Vite build-time resolution errors
        const mod = await import('socket.io-client');
        const ioClient = mod.io || mod.default || mod;

        // Get fresh Firebase token for server auth
        const { auth } = await import('../lib/firebase');
        const token = auth && auth.currentUser ? await auth.currentUser.getIdToken(true) : null;

        const socketUrl = BASE_URL ? BASE_URL.replace(/\/api$/, '') : '';
        const socket = ioClient(socketUrl, {
          path: '/socket.io',
          auth: { token },
          transports: ['websocket'],
          reconnectionAttempts: 5
        });

        socket.on('connect', () => {
          console.debug('Socket connected', socket.id);
        });

        socket.on('notifications:new', (n) => {
          if (!mounted) return;
          setNotes(prev => [n, ...prev].slice(0, 20));
          setUnread(u => u + 1);
        });

        socket.on('notifications:unread_count', (data) => {
          if (!mounted) return;
          setUnread(data.count || 0);
        });

        socket.on('disconnect', () => {
          console.debug('Socket disconnected');
        });

        socketRef.current = socket;
      } catch (e) {
        // Dynamic import failed (package missing, network, or other issue). Fall back to polling (already in place).
        console.warn('Socket.IO dynamic import failed, falling back to polling', e && e.message);
        socketRef.current = null;
      }
    };

    setup();

    return () => {
      mounted = false;
      if (socketRef.current) {
        try { socketRef.current.disconnect(); } catch (ex) { /* ignore */ }
        socketRef.current = null;
      }
    };
  }, [user]);

  // Close popup when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = async () => {
    if (!user) {
      alert('Please login to view notifications');
      return;
    }
    setOpen(prev => !prev);
    if (!open) {
      await loadRecent();
    }
  };

  const markRead = async (id, note) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (res.ok) {
        setNotes(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        setUnread(u => Math.max(0, u - 1));
      }
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      const res = await apiFetch('/api/notifications/mark-all-read', { method: 'POST' });
      if (res.ok) {
        setNotes(prev => prev.map(n => ({ ...n, read: true })));
        setUnread(0);
      }
    } catch (e) { console.error(e); }
  };

  const openNotification = async (n) => {
    if (!n.read) await markRead(n._id, n);

    setOpen(false);
    if (n.actionUrl) {
      // relative or absolute
      if (n.actionUrl.startsWith('http')) {
        window.location.href = n.actionUrl;
      } else {
        navigate(n.actionUrl);
      }
      return;
    }

    if (n.itemId) {
      navigate(`/item/${n.itemId}`);
      return;
    }

    if (n.claimId) {
      navigate(`/dashboard`);
      return;
    }

    // fallback
    navigate('/dashboard');
  };

  return (
    <div ref={containerRef} className="relative">
      <button aria-label="Notifications" className="relative" onClick={toggle}>
        <span>🔔</span>
        {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded">{unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg p-3 z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold">Notifications</div>
            <div className="flex items-center gap-2">
              <button className="text-xs text-gray-600" onClick={loadRecent} disabled={loading}>Refresh</button>
              <button className="text-xs text-primary" onClick={markAllRead}>Mark all read</button>
            </div>
          </div>

          {loading && <div className="text-sm text-gray-500">Loading...</div>}

          {!loading && notes.length === 0 && <div className="text-sm text-gray-600">No notifications</div>}

          <div className="max-h-72 overflow-auto">
            {notes.map(n => (
              <div key={n._id} className={`border-b last:border-none py-2 cursor-pointer ${n.read ? 'bg-white' : 'bg-gray-50'}`} onClick={() => openNotification(n)}>
                <div className="text-sm font-semibold">{n.title}</div>
                <div className="text-xs text-gray-600">{n.message}</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-[10px] text-gray-400">{relativeTime(n.createdAt)}</div>
                  {!n.read && <button className="text-[11px] text-primary" onClick={(e) => { e.stopPropagation(); markRead(n._id); }}>Mark</button>}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
