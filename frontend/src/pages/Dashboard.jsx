import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { auth } from "../lib/firebase";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
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
      // FIXED: Fetch dashboard data
      // ---------------------------
      const res = await apiFetch("/api/dashboard", { method: "GET" });

      if (!res.ok || !res.data) {
        console.log("Dashboard API Response:", res);
        setLoading(false);
        return;
      }

      // Safely extract values
      const profile = res.data.profile || {};
      const userItems = [
        ...(res.data.myLostItems || []).map((it) => ({ ...it, itemType: "Lost" })),
        ...(res.data.myFoundItems || []).map((it) => ({ ...it, itemType: "Found" }))
      ];

      // Sort recent first
      userItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setUserData(profile);

      // Pre-fill edit modal
      setEditData({
        fullName: profile.name || "",
        branch: profile.branch || "",
        year: profile.year || "",
        gender: profile.gender || "",
      });

      setStats(res.data.stats || { lost: 0, found: 0 });
      setItems(userItems);

      setLoading(false);

    } catch (error) {
      console.error("Dashboard fetch error:", error);
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
        return;
      }

      // Update UI
      setUserData({ ...userData, ...payload });
      setIsEditing(false);

    } catch (error) {
      console.error("Error updating profile:", error);
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

  if (loading) return <div className="text-center py-8">Loading...</div>;



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

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Reporter</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Badge</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">
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
                          {it.status || "Active"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {it.badge === "awarded" ? (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 font-bold flex items-center w-max gap-1">
                            🏅 Awarded
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-2 px-3">
                        {(it.status || 'Active') === 'Active' ? (
                          <button
                            onClick={() => handleDelete(it._id, it.status || 'Active')}
                            className="hover:scale-110 transition-transform p-1"
                            title="Delete Item"
                          >
                            <img src="/delete_icon.png" alt="Delete" className="w-5 h-5 object-contain" />
                          </button>
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
    </div>
  );
};

export default Dashboard;
