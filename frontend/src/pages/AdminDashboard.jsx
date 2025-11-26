import { useEffect, useState } from 'react';
import api from '../utils/api';

const AdminDashboard = () => {
  const [tab, setTab] = useState('claims');
  const [lost, setLost] = useState([]);
  const [found, setFound] = useState([]);
  const [claims, setClaims] = useState([]);

  const load = async () => {
    const [lostRes, foundRes, claimsRes] = await Promise.all([
      api.get('/admin/items/lost'),
      api.get('/admin/items/found'),
      api.get('/admin/claims')
    ]);
    setLost(lostRes.data.items || []);
    setFound(foundRes.data.items || []);
    setClaims(claimsRes.data.claims || []);
  };

  useEffect(() => { load(); }, []);

  const updateItemStatus = async (collection, id, status) => {
    await api.patch(`/admin/item/${id}/status`, { collection, status });
    await load();
  };
  const updateApproval = async (collection, id, approvalStatus) => {
    await api.patch(`/admin/item/${id}/approval`, { collection, approvalStatus });
    await load();
  };
  const updateClaimStatus = async (id, status) => {
    await api.patch(`/admin/claim/${id}/status`, { status });
    await load();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>
      <div className="flex gap-2 mb-6">
        <button className={`px-3 py-2 rounded ${tab==='claims'?'bg-primary text-white':'border'}`} onClick={()=>setTab('claims')}>Claims</button>
        <button className={`px-3 py-2 rounded ${tab==='lost'?'bg-primary text-white':'border'}`} onClick={()=>setTab('lost')}>Lost Items</button>
        <button className={`px-3 py-2 rounded ${tab==='found'?'bg-primary text-white':'border'}`} onClick={()=>setTab('found')}>Found Items</button>
      </div>

      {tab === 'claims' && (
        <div className="grid md:grid-cols-2 gap-4">
          {claims.map(c => (
            <div key={c._id} className="bg-white p-4 rounded-xl shadow">
              <div className="font-bold">{c.name} ({c.email})</div>
              <div className="text-sm text-gray-600">Student ID: {c.studentId}</div>
              <div className="text-sm">Item: {c.itemId} • {c.itemType}</div>
              <div className="text-sm mt-2">Proof: {c.proofDescription}</div>
              {c.proofImageUrl && <img src={c.proofImageUrl} className="mt-2 rounded" />}
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => updateClaimStatus(c._id, 'approved')}>Approve</button>
                <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => updateClaimStatus(c._id, 'rejected')}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'lost' && (
        <div className="grid md:grid-cols-3 gap-4">
          {lost.map(i => (
            <div key={i._id} className="bg-white p-4 rounded-xl shadow">
              <div className="font-bold">{i.title}</div>
              <div className="text-sm">{i.category} • {i.subcategory}</div>
              <div className="text-xs text-gray-600">{i.location} • {i.date}</div>
              <div className="mt-2 text-xs">Status: {i.status} • Approval: {i.approvalStatus}</div>
              <div className="mt-3 flex gap-2">
                <button className="px-2 py-1 border rounded" onClick={() => updateItemStatus('lost', i._id, 'Returned')}>Mark Returned</button>
                <button className="px-2 py-1 border rounded" onClick={() => updateApproval('lost', i._id, 'approved')}>Approve</button>
                <button className="px-2 py-1 border rounded" onClick={() => updateApproval('lost', i._id, 'rejected')}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'found' && (
        <div className="grid md:grid-cols-3 gap-4">
          {found.map(i => (
            <div key={i._id} className="bg-white p-4 rounded-xl shadow">
              <div className="font-bold">{i.title}</div>
              <div className="text-sm">{i.category} • {i.subcategory}</div>
              <div className="text-xs text-gray-600">{i.location} • {i.date}</div>
              <div className="mt-2 text-xs">Status: {i.status} • Approval: {i.approvalStatus}</div>
              <div className="mt-3 flex gap-2">
                <button className="px-2 py-1 border rounded" onClick={() => updateItemStatus('found', i._id, 'Returned')}>Mark Returned</button>
                <button className="px-2 py-1 border rounded" onClick={() => updateApproval('found', i._id, 'approved')}>Approve</button>
                <button className="px-2 py-1 border rounded" onClick={() => updateApproval('found', i._id, 'rejected')}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;