import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadItems();
  }, [category, search]);

  const loadItems = async () => {
    try {
      const params = { category, subcategory, location, sort, page, limit: 12 };
      if (status) params.claimedStatus = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await api.get('/api/items/gallery', { params });
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Found Items Gallery</h2>
      
      <div className="grid md:grid-cols-6 gap-3 mb-6">
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
        <input type="text" placeholder="Subcategory" className="px-4 py-2 border rounded-lg" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
        <input type="text" placeholder="Location" className="px-4 py-2 border rounded-lg" value={location} onChange={(e) => setLocation(e.target.value)} />
        <select className="px-4 py-2 border rounded-lg" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recent">Recent → Oldest</option>
          <option value="oldest">Oldest → Recent</option>
          <option value="category_az">Category A–Z</option>
        </select>
        <select className="px-4 py-2 border rounded-lg" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="unclaimed">Unclaimed</option>
          <option value="claimed">Claimed</option>
          <option value="returned">Returned</option>
        </select>
        <input type="date" className="px-4 py-2 border rounded-lg" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className="px-4 py-2 border rounded-lg" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {items.map(item => (
          <Link key={item.id} to={`/item/${item.id}`} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition">
            {item.image_url && <img src={item.image_url} className="w-full h-48 object-cover" />}
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
      <div className="flex justify-center mt-6 gap-3">
        <button className="px-4 py-2 border rounded" onClick={() => setPage(Math.max(1, page - 1))}>Prev</button>
        <button className="px-4 py-2 border rounded" onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default Gallery;
