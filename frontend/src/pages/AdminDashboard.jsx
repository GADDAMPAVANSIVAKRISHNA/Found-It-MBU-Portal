import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

const AdminDashboard = () => {
  const [tab, setTab] = useState('claims');
  const [lost, setLost] = useState([]);
  const [found, setFound] = useState([]);
  const [claims, setClaims] = useState([]);

  const load = async () => {
    const [lostRes, foundRes, claimsRes] = await Promise.all([
      apiFetch('/admin/items/lost', { method: 'GET' }),
      apiFetch('/admin/items/found', { method: 'GET' }),
      apiFetch('/admin/claims', { method: 'GET' }),
    ]);
    setLost(lostRes.data?.items || []);
    setFound(foundRes.data?.items || []);
    setClaims(claimsRes.data?.claims || []);
  };

  useEffect(() => { load(); }, []);

  const updateItemStatus = async (collection, id, status) => {
    await apiFetch(`/admin/item/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, status }),
    });
    await load();
  };
  const updateApproval = async (collection, id, approvalStatus) => {
    await apiFetch(`/admin/item/${id}/approval`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, approvalStatus }),
    });
    await load();
  };
  const updateClaimStatus = async (id, status) => {
    await apiFetch(`/admin/claim/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  return (
    <div className="w-screen overflow-x-hidden px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="w-full max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Admin Dashboard</h2>
        <div className="flex gap-2 mb-4 sm:mb-6 flex-wrap">
          <button className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm lg:text-base transition ${tab==='claims'?'bg-blue-600 text-white':'border hover:bg-gray-50'}`} onClick={()=>setTab('claims')}>Claims</button>
          <button className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm lg:text-base transition ${tab==='lost'?'bg-blue-600 text-white':'border hover:bg-gray-50'}`} onClick={()=>setTab('lost')}>Lost Items</button>
          <button className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm lg:text-base transition ${tab==='found'?'bg-blue-600 text-white':'border hover:bg-gray-50'}`} onClick={()=>setTab('found')}>Found Items</button>
        </div>

        {tab === 'claims' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {claims.map(c => (
              <div key={c._id} className="bg-white p-3 sm:p-4 rounded-xl shadow hover:shadow-md transition">
                <div className="font-bold text-xs sm:text-sm lg:text-base break-words">{c.name} ({c.email})</div>
                <div className="text-xs text-gray-600">Student ID: {c.studentId}</div>
                <div className="text-xs">Item: {c.itemId} • {c.itemType}</div>
                <div className="text-xs mt-2">Proof: {c.proofDescription}</div>
                {c.proofImageUrl && <img src={c.proofImageUrl} className="mt-2 rounded max-h-32 w-full object-cover" />}
                <div className="mt-2 sm:mt-3 flex gap-2 flex-wrap">
                  <button className="px-2 sm:px-3 py-1 rounded bg-green-600 text-white text-xs sm:text-sm hover:bg-green-700 transition" onClick={() => updateClaimStatus(c._id, 'approved')}>Approve</button>
                  <button className="px-2 sm:px-3 py-1 rounded bg-red-600 text-white text-xs sm:text-sm hover:bg-red-700 transition" onClick={() => updateClaimStatus(c._id, 'rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'lost' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {lost.map(i => (
              <div key={i._id} className="bg-white p-3 sm:p-4 rounded-xl shadow hover:shadow-md transition">
                <div className="font-bold text-xs sm:text-sm lg:text-base break-words">{i.title}</div>
                <div className="text-xs">{i.category} • {i.subcategory}</div>
                <div className="text-xs text-gray-600 break-words">{i.location} • {i.date}</div>
                <div className="mt-2 text-xs">Status: {i.status} • Approval: {i.approvalStatus}</div>
                <div className="mt-2 sm:mt-3 flex gap-2 flex-wrap">
                  <button className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm hover:bg-gray-50 transition" onClick={() => updateItemStatus('lost', i._id, 'Returned')}>Mark Returned</button>
                  <button className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm hover:bg-gray-50 transition" onClick={() => updateApproval('lost', i._id, 'approved')}>Approve</button>
                  <button className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm hover:bg-gray-50 transition" onClick={() => updateApproval('lost', i._id, 'rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'found' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {found.map(i => (
              <div key={i._id} className="bg-white p-3 sm:p-4 rounded-xl shadow hover:shadow-md transition">
                <div className="font-bold text-xs sm:text-sm lg:text-base break-words">{i.title}</div>
                <div className="text-xs">{i.category} • {i.subcategory}</div>
                <div className="text-xs text-gray-600 break-words">{i.location} • {i.date}</div>
                <div className="mt-2 text-xs">Status: {i.status} • Approval: {i.approvalStatus}</div>
                <div className="mt-2 sm:mt-3 flex gap-2 flex-wrap">
                  <button className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm hover:bg-gray-50 transition" onClick={() => updateItemStatus('found', i._id, 'Returned')}>Mark Returned</button>
                  <button className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm hover:bg-gray-50 transition" onClick={() => updateApproval('found', i._id, 'approved')}>Approve</button>
                  <button className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm hover:bg-gray-50 transition" onClick={() => updateApproval('found', i._id, 'rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;