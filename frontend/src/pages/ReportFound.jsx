import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ReportFound = () => {
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Cards', subcategory: '', location: '', date: '', image: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      alert('Image is mandatory for found items!');
      return;
    }
    try {
      await api.post('/items', { ...formData, itemType: 'Found' });
      alert('Found item reported successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert('Error reporting item');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({...formData, image: reader.result});
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-8">
      <h2 className="text-2xl font-bold mb-6">Report Found Item</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg">
        <div className="mb-4">
          <label className="block mb-2">Title</label>
          <input type="text" className="w-full px-4 py-2 border rounded-lg" 
            value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Description</label>
          <textarea className="w-full px-4 py-2 border rounded-lg" rows="4"
            value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2">Category</label>
            <select className="w-full px-4 py-2 border rounded-lg" 
              value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
              <option>Cards</option>
              <option>Electronic Devices</option>
              <option>Books</option>
              <option>Others</option>
            </select>
          </div>
          <div>
            <label className="block mb-2">Subcategory</label>
            <input type="text" className="w-full px-4 py-2 border rounded-lg" 
              value={formData.subcategory} onChange={(e) => setFormData({...formData, subcategory: e.target.value})} required />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2">Location</label>
            <input type="text" className="w-full px-4 py-2 border rounded-lg" 
              value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required />
          </div>
          <div>
            <label className="block mb-2">Date</label>
            <input type="date" className="w-full px-4 py-2 border rounded-lg" 
              value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-2">Image (Required)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="w-full" required />
          {formData.image && <p className="text-green-600 text-sm mt-2">✓ Image selected</p>}
        </div>
        <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-semibold">
          Report Found Item
        </button>
      </form>
    </div>
  );
};

export default ReportFound;
