import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadItems();
  }, [category, search]);

  const loadItems = async () => {
    try {
      const res = await api.get('/items', {
        params: { type: 'Found', status: 'Active', category, search }
      });
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Found Items Gallery</h2>
      
      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search items..."
          className="flex-1 px-4 py-2 border rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="px-4 py-2 border rounded-lg" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option>Cards</option>
          <option>Electronic Devices</option>
          <option>Books</option>
          <option>Others</option>
        </select>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {items.map(item => (
          <Link key={item._id} to={`/item/${item._id}`} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition">
            {item.image && <img src={item.image} className="w-full h-48 object-cover" />}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{item.description.substring(0, 80)}...</p>
              <div className="flex justify-between items-center text-sm">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{item.category}</span>
                <span className="text-gray-500">{new Date(item.date).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
