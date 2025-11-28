import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const ReportFound = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    subcategory: '',
    location: '',
    dateFound: '',
    approximateTime: '',
    contactPreference: 'mobile',
    email: '',
    mobile: '',
    whereKept: 'With me',
    otherLocation: '',
  });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // FORM VALIDATION
  const validateForm = () => {
    if (!formData.title.trim()) return toast.error('Please enter item title');
    if (!formData.description.trim()) return toast.error('Please enter item description');
    if (!formData.location.trim()) return toast.error('Please enter location where item was found');
    if (!formData.dateFound) return toast.error('Please select date found');
    if (!formData.approximateTime) return toast.error('Please select approximate time');
    if (!imageFile) return toast.error('Image is mandatory for found items');

    if (!formData.mobile.trim() && !formData.email.trim()) {
      return toast.error('Please provide mobile or email');
    }

    if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) {
      return toast.error('Please enter valid 10-digit mobile number');
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      return toast.error('Please enter valid email');
    }

    return true;
  };

  // FORM SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('subcategory', formData.subcategory);
      data.append('location', formData.location);
      data.append('date', formData.dateFound);
      data.append('contactNumber', formData.mobile);
      data.append('email', formData.email);
      data.append('contactPreference', formData.contactPreference);
      data.append('whereKept', formData.whereKept);

      if (imageFile) {
        const compressed = await imageCompression(imageFile, {
          maxWidthOrHeight: 800,
          maxSizeMB: 1.2,
          useWebWorker: true,
        });
        data.append('image', compressed);
      }

      // Submit to backend (JWT included by interceptor)
      await api.post('/found', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Found item reported successfully!');
      navigate('/dashboard');

    } catch (error) {
      toast.error(error.response?.data?.message || 'Error reporting found item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Report Found Item</h1>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-gray-700 text-sm">
                <span className="font-semibold">📝 Use this form to report items you found on campus.</span><br />
                <span className="text-gray-600">The details you provide help owners identify and reclaim their item quickly.</span>
              </p>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Item Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Silver Laptop, Blue Backpack"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe distinguishing features, color, brand, condition, etc."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
              />
            </div>

            {/* Category + Subcategory */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
                <input
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  placeholder="e.g., Laptop, Backpack"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Location + Date */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location Found *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Library, Cafeteria, Classroom, etc."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date Found *</label>
                <input
                  type="date"
                  name="dateFound"
                  value={formData.dateFound}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Approximate Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Approximate Time *</label>
              <select
                name="approximateTime"
                value={formData.approximateTime}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
              >
                <option value="">Select time range</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />

              {imagePreview && (
                <div className="mt-4 flex justify-center">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 max-w-sm rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setImageFile(null); }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-6">

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@mbu.edu.in"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                  />
                </div>

              </div>
            </div>

            {/* Where is the item kept? */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Where is the item kept? *</label>
              <select name="whereKept" value={formData.whereKept} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg">
                <option value="With me">With me</option>
                <option value="University Office">University Office</option>
                <option value="Security Check 1st gate">Security Check 1st gate</option>
                <option value="Security Check 2nd gate">Security Check 2nd gate</option>
                <option value="Other">Other</option>
              </select>
              {formData.whereKept === 'Other' && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Please specify where the item is kept"
                    value={formData.otherLocation || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherLocation: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md"
            >
              {loading ? 'Reporting...' : 'Report Found Item'}
            </button>

          </form>

        </div>
      </div>
    </div>
  );
};

export default ReportFound;
