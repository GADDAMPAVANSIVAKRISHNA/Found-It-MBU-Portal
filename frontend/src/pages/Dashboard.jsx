import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { apiFetch, BASE_URL } from "../utils/api";
import { auth } from "../lib/firebase";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editItemData, setEditItemData] = useState({});
  const [stats, setStats] = useState({ lost: 0, found: 0 });
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        setLoading(false);
        return;
      }

      // ---------------------------
      // REVERTED: Fetch individual data points (Legacy Pattern)
      // ---------------------------
      const [userRes, itemsRes, statsRes] = await Promise.all([
        apiFetch("/api/users/me"),
        apiFetch("/api/user/items"),
        apiFetch("/api/user/stats")
      ]);

      if (!userRes.ok) throw new Error("Failed to load profile");

      // 1. Set User Data
      setUserData(userRes.data);

      // 2. Set Items (Merge Lost & Found)
      const myLost = (itemsRes.data?.lost || []).map(i => ({ ...i, itemType: 'Lost' }));
      const myFound = (itemsRes.data?.found || []).map(i => ({ ...i, itemType: 'Found' }));

      const allItems = [...myLost, ...myFound].map(it => ({
        ...it,
        _id: typeof it._id === 'string' ? it._id : (it._id && it._id.toString ? it._id.toString() : String(it._id)),
      }));

      // Sort recent first
      allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(allItems);

      // 3. Set Stats
      setStats(itemsRes.data?.stats || statsRes.data?.stats || { lost: 0, found: 0 });

      // Pre-fill edit modal
      setEditData({
        fullName: userRes.data.name || "",
        branch: userRes.data.branch || "",
        year: userRes.data.year || "",
        gender: userRes.data.gender || "",
      });

      setLoading(false);

    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Error loading dashboard data");
      setLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleSaveChanges = async () => {
    try {
      const payload = {
        name: editData.fullName,
        branch: editData.branch,
        year: editData.year,
        gender: editData.gender,
      };

      const res = await apiFetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.log("Profile update error:", res);
        toast.error("Failed to update profile");
        return;
      }

      // Update UI
      setUserData({ ...userData, ...payload });
      setIsEditing(false);
      toast.success("Profile updated successfully");

    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    }
  };

  const handleEditItemClick = (item) => {
    setEditItemData({
      ...item,
      _id: typeof item._id === 'string' ? item._id : (item._id && item._id.toString ? item._id.toString() : String(item._id)),
      // Ensure date is YYYY-MM-DD
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
      // Map legacy fields if needed
      contactNumber: item.userContact || item.contactNumber || '',
    });
    setIsEditingItem(true);
  };

  const handleSaveItemChanges = async () => {
    try {
      if (!editItemData._id) {
        toast.error("Item ID is missing");
        return;
      }

      const rawId = String(editItemData._id);
      const cleanId = rawId.includes('_') ? rawId.split('_')[1] : rawId;

      const token = auth.currentUser ? await auth.currentUser.getIdToken(true) : null;

      const response = await fetch(`${BASE_URL}/items/${cleanId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(editItemData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const msg = data?.message || "Failed to update item";
        throw new Error(msg);
      }

      toast.success("Item updated successfully!");
      setIsEditingItem(false);
      await fetchDashboardData();

    } catch (error) {
      console.error(error);
      toast.error("Error updating item");
    }
  };

  const handleDelete = async (itemId, status) => {
    if (status !== 'Active' && status !== 'active') { // handle case sensitivity just in case
      return toast.error("Cannot delete items that are completed/claimed.");
    }

    if (!window.confirm("Are you sure you want to delete this reported item? This action ensures it is removed from the public list.")) {
      return;
    }

    try {
      // itemId might need to ensure it has correct format if backend expects prefix
      // Currently backend handles prefix or raw. Frontend items have raw _id usually, or mapped _id.
      // In Dashboard.js fetchDashboardData, items are mapped from lean() objects directly from dashboard.js route
      // which returns `myLostItems` and `myFoundItems`. These are raw docs.
      // Backend DELETE supports raw ID search across both collections.

      const res = await apiFetch(`/api/items/${itemId}`, { method: 'DELETE' });

      if (res.ok) {
        toast.success("Item deleted successfully");
        setItems(prev => prev.filter(i => i._id !== itemId));
        // Update stats slightly? optional.
      } else {
        toast.error(res.data?.message || "Failed to delete item");
      }
    } catch (err) {
      toast.error("Error deleting item");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper w-screen overflow-x-hidden">
        <div className="dashboard-bg"></div>
        <div className="dashboard-container px-4 py-6">
          {/* Welcome Card Skeleton */}
          <div className="welcome-card animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-lg shadow-lg p-4 mt-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {/* Header */}
              <div className="h-10 bg-gray-100 rounded w-full"></div>
              {/* Rows */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="dashboard-wrapper w-screen overflow-x-hidden">
      <div className="dashboard-bg"></div>

      <div className="dashboard-container px-4 py-6">
        {/* Welcome Section */}
        <div className="welcome-card">
          <div className="welcome-header flex flex-col sm:flex-row justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{userData?.name || "User"}</span>!
              </h1>
            </div>

            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </div>

          <div className="user-details-row grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div>
              <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Email</span>
              <p className="text-sm sm:text-base font-semibold text-gray-700 break-all">{userData?.email || "—"}</p>
            </div>
            <div>
              <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Branch</span>
              <p className="text-sm sm:text-base font-semibold text-indigo-700 break-words">{userData?.branch || "—"}</p>
            </div>
            <div>
              <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Year</span>
              <p className="text-sm sm:text-base font-semibold text-teal-700">{userData?.year || "—"}</p>
            </div>
            <div>
              <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Gender</span>
              <p className="text-sm sm:text-base font-semibold text-rose-700">{userData?.gender || "—"}</p>
            </div>
          </div>
        </div>

        {/* All Reported Items */}
        <div className="bg-white rounded-lg shadow-lg p-4 mt-6">
          <h2 className="text-xl font-bold mb-3">All Reported Items</h2>

          <div className="overflow-x-auto table-scroll-container pb-2">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Reporter</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Badge</th>
                  <th className="py-2 px-3">Confirmed By</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-gray-500">
                      No items reported yet.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it._id} className="border-b">
                      <td className="py-2 px-3">{it.title}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs border ${it.itemType === 'Lost' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                          {it.itemType}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600">{it.userEmail || userData?.email || "—"}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-1 rounded text-xs border bg-gray-50 text-gray-600 border-gray-200 uppercase">
                          {it.status === "Active" ? "Active" : it.status || "Active"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {it.badge ? (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 font-bold flex items-center w-max gap-1">
                            🏅 {it.badge}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {it.confirmedBy || (it.claimedBy ? (
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-blue-600">{it.claimedBy.name}</span>
                            <span>{it.claimedBy.email}</span>
                          </div>
                        ) : "—")}
                      </td>
                      <td className="py-2 px-3">
                        {(it.status || 'Active') === 'Active' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditItemClick(it)}
                              className="hover:scale-110 transition-transform p-1"
                              title="Edit Item"
                            >
                              <img src="/edit_icon.png" alt="Edit" className="w-5 h-5 object-contain" />
                            </button>
                            <button
                              onClick={() => handleDelete(it._id, it.status || 'Active')}
                              className="hover:scale-110 transition-transform p-1"
                              title="Delete Item"
                            >
                              <img src="/delete_icon.png" alt="Delete" className="w-5 h-5 object-contain" />
                            </button>
                          </div>
                        ) : (
                          <span className="opacity-50 cursor-not-allowed inline-block p-1" title="Cannot delete">
                            <img src="/delete_icon.png" alt="Delete" className="w-5 h-5 object-contain grayscale" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isEditing && (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsEditing(false);
            setEditData({
              fullName: userData.name,
              branch: userData.branch,
              year: userData.year,
              gender: userData.gender,
            });
          }}
        >
          <div
            className="modal-content w-full max-w-md sm:max-w-lg lg:max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setIsEditing(false);
                  setEditData({
                    fullName: userData.name,
                    branch: userData.branch,
                    year: userData.year,
                    gender: userData.gender,
                  });
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editData.fullName || ""}
                    onChange={(e) => handleEditChange("fullName", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Branch</label>
                  <input
                    type="text"
                    value={editData.branch || ""}
                    onChange={(e) => handleEditChange("branch", e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-row">
                <div className="form-group">
                  <label>Year</label>
                  <select
                    value={editData.year || ""}
                    onChange={(e) => handleEditChange("year", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={editData.gender || ""}
                    onChange={(e) => handleEditChange("gender", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setIsEditing(false);
                  setEditData({
                    fullName: userData.name,
                    branch: userData.branch,
                    year: userData.year,
                    gender: userData.gender,
                  });
                }}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveChanges}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditingItem && (
        <div
          className="modal-overlay"
          onClick={() => setIsEditingItem(false)}
        >
          <div
            className="modal-content w-full max-w-md sm:max-w-lg lg:max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Edit Report</h2>
              <button className="modal-close" onClick={() => setIsEditingItem(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group mb-2">
                <label>Title</label>
                <input
                  type="text"
                  value={editItemData.title || ""}
                  onChange={(e) => setEditItemData({ ...editItemData, title: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>

              <div className="form-group mb-2">
                <label>Description</label>
                <textarea
                  value={editItemData.description || ""}
                  onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
                  className="w-full border rounded p-2"
                  rows="3"
                />
              </div>

              <div className="modal-row grid grid-cols-2 gap-2">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editItemData.location || ""}
                    onChange={(e) => setEditItemData({ ...editItemData, location: e.target.value })}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={editItemData.date || ""}
                    onChange={(e) => setEditItemData({ ...editItemData, date: e.target.value })}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>

              <div className="modal-row grid grid-cols-2 gap-2 mt-2">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={editItemData.category || "Others"}
                    onChange={(e) => setEditItemData({ ...editItemData, category: e.target.value })}
                    className="w-full border rounded p-2"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Books">Books</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Keys">Keys</option>
                    <option value="Wallet">Wallet</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={editItemData.contactNumber || ""}
                    onChange={(e) => setEditItemData({ ...editItemData, contactNumber: e.target.value })}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>

              {editItemData.itemType === 'Found' && (
                <div className="form-group mt-2">
                  <label>Where Kept / Submitted?</label>
                  <input
                    type="text"
                    value={editItemData.whereKept || ""}
                    onChange={(e) => setEditItemData({ ...editItemData, whereKept: e.target.value })}
                    className="w-full border rounded p-2"
                    placeholder="e.g. Security Office"
                  />
                </div>
              )}
            </div>

            <div className="modal-footer mt-4">
              <button className="btn-cancel mr-2" onClick={() => setIsEditingItem(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveItemChanges}>
                Update Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Dashboard;
