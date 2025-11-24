import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const ItemDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
      if (error) throw error;
      setItem(data);
    } catch (err) {
      console.error(err);
    }
  };

  const claimItem = async () => {
    if (!isAuthenticated) {
      alert('Please login to claim items');
      navigate('/login');
      return;
    }
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const { error: claimErr } = await supabase.from('claimed_items').insert({
        item_id: id,
        claimed_by: user.id,
        claim_date: new Date().toISOString(),
        status: 'Pending'
      });
      if (claimErr) throw claimErr;
      await supabase.from('items').update({ status: 'Claimed' }).eq('id', id);
      alert('Item claimed! Visit Lost & Found office to collect.');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Error claiming item');
    }
  };

  if (!item) return <div className="text-center py-16">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            {item.image_url ? (
              <img src={item.image_url} className="w-full h-96 object-cover rounded-lg" />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-xl">No Image</span>
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className={`px-3 py-1 rounded-full ${item.item_type === 'Lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {item.item_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full ${item.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {item.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <strong>{item.category}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subcategory:</span>
                <strong>{item.subcategory}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <strong>{item.location}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <strong>{new Date(item.date).toLocaleDateString()}</strong>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-2">Description:</h3>
              <p className="text-gray-700">{item.description}</p>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">Contact:</h3>
              <p><strong>Name:</strong> {item.user_name}</p>
              <p><strong>Phone:</strong> {item.user_contact}</p>
            </div>

            {item.item_type === 'Found' && item.status === 'Active' && (
              <button onClick={claimItem} className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-lg hover:bg-primary/90">
                🎯 CLAIM NOW
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
