import React, { useState, useEffect } from "react";
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

      // Fetch dashboard data (stats + profile + items)
      const res = await apiFetch("/api/dashboard", { method: "GET" });

      if (!res.ok) {
        console.log(res);
        setLoading(false);
        return;
      }

      const { profile, stats: dashboardStats, items: reportedItems } = res.data;

      setUserData(profile);
      setEditData({
        fullName: profile.name || "",
        branch: profile.branch || "",
        year: profile.year || "",
        gender: profile.gender || "",
      });

      setStats({
        lost: dashboardStats?.lost || 0,
        found: dashboardStats?.found || 0,
      });

      setItems(Array.isArray(reportedItems) ? reportedItems : []);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: value,
    });
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
        console.log(res);
        return;
      }

      setUserData({
        ...userData,
        name: payload.name,
        branch: payload.branch,
        year: payload.year,
        gender: payload.gender,
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 sm:py-16 text-xs sm:text-sm lg:text-base">Loading...</div>;
  }

  return (
    <div className="dashboard-wrapper w-screen overflow-x-hidden">
      <div className="dashboard-bg"></div>

      <div className="dashboard-container px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="welcome-card">
          <div className="welcome-header flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            <div className="user-greeting min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">
                Welcome,{" "}
                <span className="user-name">{userData?.name || "User"}</span>!
              </h1>
              <p className="user-email text-xs sm:text-sm lg:text-base break-all">{userData?.email}</p>
            </div>

            <button
              className="edit-profile-btn whitespace-nowrap text-xs sm:text-sm"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>

          {/* User Details */}
          <div className="user-details-row grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-4">
            <div className="detail-item">
              <span className="detail-label text-xs sm:text-sm">Email</span>
              <span className="detail-value text-xs sm:text-sm break-all">{userData?.email || "—"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label text-xs sm:text-sm">Branch</span>
              <span className="detail-value text-xs sm:text-sm break-words">{userData?.branch || "—"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label text-xs sm:text-sm">Year</span>
              <span className="detail-value text-xs sm:text-sm">{userData?.year || "—"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label text-xs sm:text-sm">Gender</span>
              <span className="detail-value text-xs sm:text-sm">{userData?.gender || "—"}</span>
            </div>
          </div>
        </div>

        {/* All Reported Items */}
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 mt-4 sm:mt-6 lg:mt-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 break-words">All Reported Items</h2>
          <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="py-2 px-2 sm:px-3 lg:px-4">Title</th>
                  <th className="py-2 px-2 sm:px-3 lg:px-4">Type</th>
                  <th className="py-2 px-2 sm:px-3 lg:px-4 hidden sm:table-cell">Reporter</th>
                  <th className="py-2 px-2 sm:px-3 lg:px-4">Status</th>
                  <th className="py-2 px-2 sm:px-3 lg:px-4 hidden lg:table-cell">Badge</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 px-2 sm:px-3 lg:px-4 text-gray-500 text-center">No items reported yet.</td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 sm:px-3 lg:px-4 break-words">{it.title}</td>
                      <td className="py-2 px-2 sm:px-3 lg:px-4">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs border whitespace-nowrap ${ (it.itemType || it.type) === 'Found' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200' }`}>
                          {(it.itemType || it.type || '').toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2 px-2 sm:px-3 lg:px-4 hidden sm:table-cell break-all text-xs">{it.userEmail || it.reporterEmail || ''}</td>
                      <td className="py-2 px-2 sm:px-3 lg:px-4">{(it.status || 'active').toLowerCase()}</td>
                      <td className="py-2 px-2 sm:px-3 lg:px-4 hidden lg:table-cell">
                        {(it.badge || '').toLowerCase() === 'awarded' ? (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full">🏅 Awarded</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
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

      {/* Edit Profile Modal */}
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
            className="modal-content w-full max-w-xs sm:max-w-sm lg:max-w-md mx-3 sm:mx-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="text-lg sm:text-xl lg:text-2xl">Edit Profile</h2>
              <button
                className="modal-close text-lg sm:text-xl"
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
              <div className="modal-row grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="form-group">
                  <label className="text-xs sm:text-sm">Full Name</label>
                  <input
                    type="text"
                    className="text-xs sm:text-sm"
                    value={editData.fullName || ""}
                    onChange={(e) =>
                      handleEditChange("fullName", e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="text-xs sm:text-sm">Branch</label>
                  <input
                    type="text"
                    className="text-xs sm:text-sm"
                    value={editData.branch || ""}
                    onChange={(e) =>
                      handleEditChange("branch", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="modal-row grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="form-group">
                  <label className="text-xs sm:text-sm">Year</label>
                  <div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="1"
                      className="w-full"
                      value={Number(String(editData.year || '1').replace(/[^0-9]/g,'')) || 1}
                      onChange={(e) => handleEditChange("year", e.target.value)}
                    />
                    <div className="text-xs text-gray-600 mt-1">Selected: {Number(String(editData.year || '1').replace(/[^0-9]/g,'')) || 1} Year</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-xs sm:text-sm">Gender</label>
                  <select
                    className="text-xs sm:text-sm"
                    value={editData.gender || ""}
                    onChange={(e) =>
                      handleEditChange("gender", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer flex gap-2 sm:gap-3">
              <button
                className="btn-cancel flex-1 text-xs sm:text-sm"
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

              <button className="btn-save flex-1 text-xs sm:text-sm" onClick={handleSaveChanges}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

