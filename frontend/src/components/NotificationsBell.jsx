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
import { useLocation } from 'react-router-dom';

const NotificationsBell = () => {
  const location = useLocation();
  const containerRef = useRef(null);
  const [showMsg, setShowMsg] = useState(false);

  // Disable notifications until backend endpoints are created
  useEffect(() => {
    console.log("Notifications temporarily disabled — no backend API available.");
  }, []);

  // Close popup when route changes
  useEffect(() => {
    setShowMsg(false);
  }, [location.pathname]);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowMsg(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = () => {
    setShowMsg(true);
    setTimeout(() => {
      setShowMsg(false);
    }, 1500);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-label="Notifications"
        className="relative"
        onClick={handleClick}
      >
        <span>🔔</span>
      </button>

      {showMsg && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-800 text-xs rounded-md shadow-lg border border-gray-200 p-2 z-50 text-center animate-fade-in-down">
          Notifications feature is coming soon.
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
