import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import imageCompression from 'browser-image-compression';

import { auth } from '../lib/firebase';
const ReportLost = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Cards",
    subcategory: "",
    location: "",
    date: "",
    imageFile: null,
    previewUrl: "",
    contactNumber: ""
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("description", formData.description);
      fd.append("location", formData.location);
      fd.append("date", formData.date);
      fd.append("contactNumber", formData.contactNumber);
      fd.append("category", formData.category);
      fd.append("subcategory", formData.subcategory);

      if (formData.imageFile) {
        const compressed = await imageCompression(formData.imageFile, { maxWidthOrHeight: 800, maxSizeMB: 1.2, useWebWorker: true });
        fd.append("image", new File([compressed], formData.imageFile.name, { type: compressed.type }));
      }

      // Call backend /api/report-lost endpoint (JWT auth via interceptor)
      // Get Firebase auth token
const user = auth.currentUser;
if (!user) {
  throw new Error('Please login to report items');
}
const token = await user.getIdToken();

// Send to backend with JWT authentication
const res = await api.post('/report-lost', fd, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});


      if (!res.data?.success) {
        throw new Error(res.data?.message || "Error reporting item");
      }

      alert("Lost item reported successfully!");
      navigate("/dashboard");
    } catch (err) {
      // log full axios error for debugging
      console.error('[ReportLost] submit error', err);
      // prefer backend's `error` field (detailed message), then `message`
      const serverMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
      alert(`Error reporting item: ${serverMsg}`);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        imageFile: file,
        previewUrl: URL.createObjectURL(file),
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-8">
      <h2 className="text-2xl font-bold mb-6">Report Lost Item</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg">

        {/* TITLE */}
        <div className="mb-4">
          <label className="block mb-2">Title</label>
          <input
            name="title"
            type="text"
            className="w-full px-4 py-2 border rounded-lg"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        {/* DESCRIPTION */}
        <div className="mb-4">
          <label className="block mb-2">Description</label>
          <textarea
            name="description"
            className="w-full px-4 py-2 border rounded-lg"
            rows="4"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />
        </div>

        {/* CATEGORY + SUBCATEGORY */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2">Category</label>
            <select
              name="category"
              className="w-full px-4 py-2 border rounded-lg"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option>Cards</option>
              <option>Electronic Devices</option>
              <option>Books</option>
              <option>Others</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Subcategory</label>
            <input
              name="subcategory"
              type="text"
              className="w-full px-4 py-2 border rounded-lg"
              value={formData.subcategory}
              onChange={(e) =>
                setFormData({ ...formData, subcategory: e.target.value })
              }
              required
            />
          </div>
        </div>

        {/* LOCATION + DATE */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2">Location</label>
            <input
              name="location"
              type="text"
              className="w-full px-4 py-2 border rounded-lg"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block mb-2">Date</label>
            <input
              name="date"
              type="date"
              className="w-full px-4 py-2 border rounded-lg"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>
        </div>

        {/* IMAGE */}
        <div className="mb-4">
          <label className="block mb-2">Image (Optional)</label>
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
          />

          {formData.previewUrl && (
            <img
              src={formData.previewUrl}
              alt="Preview"
              className="mt-3 w-full max-h-80 object-contain rounded-lg border"
            />
          )}
        </div>

        {/* CONTACT NUMBER */}
        <div className="mb-4">
          <label className="block mb-2">Contact Number</label>
          <input
            name="contactNumber"
            type="tel"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Your phone number"
            value={formData.contactNumber}
            onChange={(e) =>
              setFormData({ ...formData, contactNumber: e.target.value })
            }
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded-lg font-semibold"
        >
          Report Lost Item
        </button>
      </form>
    </div>
  );
};

export default ReportLost;
