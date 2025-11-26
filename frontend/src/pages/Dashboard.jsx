// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { supabase } from '../lib/supabaseClient';
// import api from '../utils/api';

// const Dashboard = () => {
//   const { user } = useAuth();
//   const [myItems, setMyItems] = useState([]);
//   const [lostItems, setLostItems] = useState([]);
//   const [foundItems, setFoundItems] = useState([]);
//   const [claims, setClaims] = useState([]);

//   useEffect(() => {
//     loadMyItems();
//   }, []);

//   const loadMyItems = async () => {
//     try {
//       const user = (await supabase.auth.getUser()).data.user;
//       const [{ data: my }, { data: myClaims }] = await Promise.all([
//         api.get(`/api/items/user/${user.id}`),
//         api.get(`/api/claim/user/${user.id}`)
//       ]);
//       setLostItems(my.lost || []);
//       setFoundItems(my.found || []);
//       setClaims(myClaims.claims || []);
//       setMyItems([]);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const deleteItem = async (id) => {
//     if (confirm('Delete this item?')) {
//       try {
//         await supabase.from('items').delete().eq('id', id);
//         loadMyItems();
//       } catch (err) {
//         alert('Error deleting item');
//       }
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
//         <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name}!</h2>
//         <div className="grid md:grid-cols-2 gap-4 text-sm">
//           <p><strong>Email:</strong> {user?.email}</p>
//           <p><strong>Branch:</strong> {user?.branch}</p>
//           <p><strong>Year:</strong> {user?.year}</p>
//         </div>
//       </div>

//       <div className="flex justify-between items-center mb-6">
//         <h3 className="text-xl font-bold">My Items</h3>
//         <div className="space-x-2">
//           <Link to="/report-lost" className="bg-gray-200 px-4 py-2 rounded-lg">Report Lost</Link>
//           <Link to="/report-found" className="bg-primary text-white px-4 py-2 rounded-lg">Report Found</Link>
//         </div>
//       </div>

//       <div className="grid md:grid-cols-2 gap-8">
//         <section>
//           <h3 className="text-lg font-bold mb-3">Reported by You — Lost</h3>
//           <div className="grid md:grid-cols-2 gap-4">
//             {lostItems.map(i => (
//               <div key={i._id} className="bg-white p-4 rounded-xl shadow">
//                 <div className="font-semibold">{i.title}</div>
//                 <div className="text-sm text-gray-600">{i.category} • {i.subcategory}</div>
//                 <div className="text-xs">{i.location} • {i.date}</div>
//                 <div className="text-xs mt-2">Status: {i.status} • Approval: {i.approvalStatus}</div>
//               </div>
//             ))}
//           </div>
//           <h3 className="text-lg font-bold mt-6 mb-3">Reported by You — Found</h3>
//           <div className="grid md:grid-cols-2 gap-4">
//             {foundItems.map(i => (
//               <div key={i._id} className="bg-white p-4 rounded-xl shadow">
//                 <div className="font-semibold">{i.title}</div>
//                 <div className="text-sm text-gray-600">{i.category} • {i.subcategory}</div>
//                 <div className="text-xs">{i.location} • {i.date}</div>
//                 <div className="text-xs mt-2">Status: {i.status} • Approval: {i.approvalStatus}</div>
//               </div>
//             ))}
//           </div>
//         </section>
//         <section>
//           <h3 className="text-lg font-bold mb-3">Claims Submitted</h3>
//           <div className="space-y-3">
//             {claims.map(c => (
//               <div key={c._id} className="bg-white p-4 rounded-xl shadow">
//                 <div className="font-semibold">{c.itemType.toUpperCase()} • {c.itemId}</div>
//                 <div className="text-sm">Status: <span className="font-bold capitalize">{c.status}</span></div>
//                 <div className="text-xs text-gray-600 mt-1">Proof: {c.proofDescription}</div>
//                 {c.proofImageUrl && <img src={c.proofImageUrl} className="mt-2 rounded" />}
//               </div>
//             ))}
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { auth } from '../lib/firebase';

const Dashboard = () => {
  const { user } = useAuth();
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    loadMyItems();
  }, []);

  const loadMyItems = async () => {
    try {
      const u = auth.currentUser;
      if (!u) return;
      const [{ data: my }, { data: myClaims }] = await Promise.all([
        api.get(`/api/items/user/${u.uid}`),
        api.get(`/api/claim/user/${u.uid}`)
      ]);

      setLostItems(my.lost || []);
      setFoundItems(my.found || []);
      setClaims(myClaims.claims || []);
    } catch (err) {
      console.error("[Dashboard] Load error:", err);
    }
  };

  const deleteItem = async (id) => {
    if (confirm("Delete this item?")) {
      try {
        await api.delete(`/api/items/${id}`);
        loadMyItems();
      } catch (err) {
        alert("Error deleting item");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* USER CARD */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name}!</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Branch:</strong> {user?.branch}</p>
          <p><strong>Year:</strong> {user?.year}</p>
        </div>
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">My Items</h3>
        <div className="space-x-2">
          <Link to="/report-lost" className="bg-gray-200 px-4 py-2 rounded-lg">
            Report Lost
          </Link>
          <Link to="/report-found" className="bg-primary text-white px-4 py-2 rounded-lg">
            Report Found
          </Link>
        </div>
      </div>

      {/* ITEMS GRID */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* LOST ITEMS */}
        <section>
          <h3 className="text-lg font-bold mb-3">Reported by You — Lost</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {lostItems.map((i) => (
              <div key={i._id} className="bg-white p-4 rounded-xl shadow">
                <div className="font-semibold">{i.title}</div>
                <div className="text-sm text-gray-600">
                  {i.category} • {i.subcategory}
                </div>
                <div className="text-xs">{i.location} • {i.date}</div>
                <div className="text-xs mt-2">
                  Status: {i.status} • Approval: {i.approvalStatus}
                </div>
              </div>
            ))}
          </div>

          {/* FOUND ITEMS */}
          <h3 className="text-lg font-bold mt-6 mb-3">Reported by You — Found</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {foundItems.map((i) => (
              <div key={i._id} className="bg-white p-4 rounded-xl shadow">
                <div className="font-semibold">{i.title}</div>
                <div className="text-sm text-gray-600">
                  {i.category} • {i.subcategory}
                </div>
                <div className="text-xs">{i.location} • {i.date}</div>
                <div className="text-xs mt-2">
                  Status: {i.status} • Approval: {i.approvalStatus}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CLAIMS */}
        <section>
          <h3 className="text-lg font-bold mb-3">Claims Submitted</h3>
          <div className="space-y-3">
            {claims.map((c) => (
              <div key={c._id} className="bg-white p-4 rounded-xl shadow">
                <div className="font-semibold">
                  {c.itemType.toUpperCase()} • {c.itemId}
                </div>
                <div className="text-sm">
                  Status: <span className="font-bold capitalize">{c.status}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Proof: {c.proofDescription}
                </div>
                {c.proofImageUrl && (
                  <img src={c.proofImageUrl} className="mt-2 rounded" />
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
