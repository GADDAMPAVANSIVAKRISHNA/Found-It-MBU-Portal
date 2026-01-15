import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { toast } from 'react-hot-toast';

const categories = [
  'Electronics', 'Accessories', 'Documents', 'Books',
  'Clothing', 'Keys', 'Bags', 'Others'
];

const timeOptions = [
  'Morning (6 AM - 12 PM)',
  'Afternoon (12 PM - 5 PM)',
  'Evening (5 PM - 9 PM)',
  'Night (9 PM - 6 AM)'
];

const ReportForm = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('lost');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [whereKeptOption, setWhereKeptOption] = useState('With me');

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    subcategory: '',
    location: '',
    date: '',
    approximateTime: '',
    email: '',
    mobile: '',
    whereKept: '',
    otherLocation: '',
  });

  const headerTitle = tab === 'lost' ? 'Report a Lost Item' : 'Report a Found Item';
  const headerAccent = tab === 'lost' ? 'red' : 'green';

  // Get today's date in YYYY-MM-DD format for max attribute
  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    if (!form.title.trim()) return toast.error('Please enter item title');
    if (!form.description.trim()) return toast.error('Please enter item description');
    if (!form.location.trim()) return toast.error('Please enter location');
    if (!form.date) return toast.error('Please select date');

    // Future Date Validation
    const selectedDate = new Date(form.date);
    const currentDate = new Date();
    // Reset time parts for accurate date-only comparison
    selectedDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (selectedDate > currentDate) {
      return toast.error('Future dates are not allowed. Please select today or a past date.');
    }

    if (!form.approximateTime) return toast.error('Please select approximate time');
    if (!form.mobile.trim() && !form.email.trim()) return toast.error('Please provide mobile or email');

    // Strict Mobile Validation
    if (form.mobile) {
      if (!/^\d{10}$/.test(form.mobile)) {
        return toast.error('Please enter a valid 10-digit mobile number');
      }
    }

    // Strict Email Validation
    if (form.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        return toast.error('Please enter a valid email address');
      }
    }

    if (tab === 'found' && !imageFile) return toast.error('Image is mandatory for found items');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('category', form.category);
      if (tab === 'found') data.append('subcategory', form.subcategory);
      data.append('location', form.location);
      data.append('date', form.date);
      data.append('contactNumber', form.mobile);
      data.append('email', form.email);
      data.append('contactPreference', 'mobile');
      data.append('whereKept', form.whereKept);
      data.append('otherLocation', form.otherLocation || '');

      if (imageFile) data.append('image', imageFile);

      const endpoint = tab === 'lost' ? '/api/lost' : '/api/found';
      const res = await apiFetch(endpoint, { method: 'POST', body: data });
      if (!res.ok) return toast.error(res?.data?.message || 'Submission failed');
      toast.success('Report submitted successfully', { position: 'top-center' });
      setForm({
        title: '',
        description: '',
        category: 'Electronics',
        subcategory: '',
        location: '',
        date: '',
        approximateTime: '',
        email: '',
        mobile: '',
        whereKept: '',
        otherLocation: '',
      });
      handleRemoveImage();
    } catch (err) {
      toast.error(err?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-start pt-10 pb-10 px-4">
      <div className="w-full max-w-[800px] mx-auto">
        <div className={`bg-white rounded-2xl p-6 shadow-md border-2 ${tab === 'lost' ? 'border-red-500' : 'border-green-500'} transition-colors`}>
          <div className="mb-6 text-center">
            <h1 className={`text-3xl font-bold text-gray-800 mb-2`}>{headerTitle}</h1>
            <div className={`flex justify-center gap-2`}>
              <button
                type="button"
                onClick={() => setTab('lost')}
                className={`px-4 py-2 rounded-full text-sm font-semibold border ${tab === 'lost' ? 'bg-red-600 text-white border-red-700' : 'bg-red-50 text-red-700 border-red-200'}`}
              >
                I Lost Something
              </button>
              <button
                type="button"
                onClick={() => setTab('found')}
                className={`px-4 py-2 rounded-full text-sm font-semibold border ${tab === 'found' ? 'bg-green-600 text-white border-green-700' : 'bg-green-50 text-green-700 border-green-200'}`}
              >
                I Found Something
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 compact-form">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Blue Samsonite Bag"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {tab === 'found' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
                  <input
                    type="text"
                    name="subcategory"
                    value={form.subcategory}
                    onChange={handleChange}
                    placeholder="e.g. Laptop, Backpack"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Provide details like color, brand, distinct marks..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  max={today}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Approximate Time *</label>
                <select
                  name="approximateTime"
                  value={form.approximateTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                >
                  <option value="">Select time range</option>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Library 2nd Floor"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
              />
            </div>

            {tab === 'found' && (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Where is the item now? *</label>

                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="whereKeptOption"
                      value="With me"
                      checked={whereKeptOption === 'With me'}
                      onChange={() => {
                        setWhereKeptOption('With me');
                        setForm(prev => ({ ...prev, whereKept: 'With me' }));
                      }}
                      className="accent-green-600 w-4 h-4"
                    />
                    <span className="text-gray-700">With me</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="whereKeptOption"
                      value="Other"
                      checked={whereKeptOption === 'Other'}
                      onChange={() => {
                        setWhereKeptOption('Other');
                        setForm(prev => ({ ...prev, whereKept: '' }));
                      }}
                      className="accent-green-600 w-4 h-4"
                    />
                    <span className="text-gray-700">Other</span>
                  </label>
                </div>

                {whereKeptOption === 'Other' && (
                  <input
                    type="text"
                    name="whereKept"
                    value={form.whereKept}
                    onChange={handleChange}
                    placeholder="e.g. Submitted to Security Office, Main Gate"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg animate-fade-in-down"
                  />
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image {tab === 'found' ? '(Mandatory)' : '(Optional)'}</label>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} className="w-full" />
              {imagePreview && (
                <div className="relative mt-3 inline-block border rounded overflow-hidden max-w-full">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="max-h-[500px] w-auto max-w-full object-contain block"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-red-700 transition-colors z-10"
                    title="Remove Image"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number *</label>
                <input
                  type="text"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. student@mbu.asia"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
