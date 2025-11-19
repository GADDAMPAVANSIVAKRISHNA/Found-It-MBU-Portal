import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [myItems, setMyItems] = useState([]);

  useEffect(() => {
    loadMyItems();
  }, []);

  const loadMyItems = async () => {
    try {
      const res = await api.get('/items/user/my-items');
      setMyItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id) => {
    if (confirm('Delete this item?')) {
      try {
        await api.delete(`/items/${id}`);
        loadMyItems();
      } catch (err) {
        alert('Error deleting item');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name}!</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>SAP ID:</strong> {user?.sapId}</p>
          <p><strong>Branch:</strong> {user?.branch}</p>
          <p><strong>Year:</strong> {user?.year}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">My Items</h3>
        <div className="space-x-2">
          <Link to="/report-lost" className="bg-gray-200 px-4 py-2 rounded-lg">Report Lost</Link>
          <Link to="/report-found" className="bg-primary text-white px-4 py-2 rounded-lg">Report Found</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {myItems.map(item => (
          <div key={item._id} className="bg-white rounded-xl shadow-lg p-4">
            {item.image && <img src={item.image} className="w-full h-48 object-cover rounded-lg mb-4" />}
            <h4 className="font-bold text-lg mb-2">{item.title}</h4>
            <p className="text-gray-600 text-sm mb-2">{item.description.substring(0, 100)}...</p>
            <div className="flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-sm ${item.itemType === 'Lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {item.itemType}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${item.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                {item.status}
              </span>
            </div>
            <div className="mt-4 space-x-2">
              <Link to={`/item/${item._id}`} className="text-primary text-sm">View</Link>
              <button onClick={() => deleteItem(item._id)} className="text-red-500 text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
