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

  if (loading) return <div className="text-center py-8">Loading...</div>;

  // Extract Roll Number (before @)
  const rollNumber = userData?.email?.split("@")[0] || "";

  return (
    <div className="dashboard-wrapper w-screen overflow-x-hidden">
      <div className="dashboard-bg"></div>

      <div className="dashboard-container px-4 py-6">
        {/* Welcome Section */}
        <div className="welcome-card">
          <div className="welcome-header flex flex-col sm:flex-row justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome, <span className="text-blue-600">{rollNumber}</span>!
              </h1>
              <p className="text-sm break-all">{userData?.email}</p>
            </div>

            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </div>

          <div className="user-details-row grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div>
              <span>Email</span>
              <p>{userData?.email || "—"}</p>
            </div>
            <div>
              <span>Branch</span>
              <p>{userData?.branch || "—"}</p>
            </div>
            <div>
              <span>Year</span>
              <p>{userData?.year || "—"}</p>
            </div>
            <div>
              <span>Gender</span>
              <p>{userData?.gender || "—"}</p>
            </div>
          </div>
        </div>

        {/* All Reported Items */}
        <div className="bg-white rounded-lg shadow-lg p-4 mt-6">
          <h2 className="text-xl font-bold mb-3">All Reported Items</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Badge</th>
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
                      <td className="py-2 px-3">{it.itemType}</td>
                      <td className="py-2 px-3">{it.status || "Active"}</td>
                      <td className="py-2 px-3">
                        {it.badge === "awarded" ? "🏅 Awarded" : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT MODAL — Unchanged */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>

            <label>Full Name</label>
            <input
              value={editData.fullName}
              onChange={(e) => handleEditChange("fullName", e.target.value)}
            />

            <label>Branch</label>
            <input
              value={editData.branch}
              onChange={(e) => handleEditChange("branch", e.target.value)}
            />

            <label>Year</label>
            <input
              type="number"
              min="1"
              max="4"
              value={editData.year}
              onChange={(e) => handleEditChange("year", e.target.value)}
            />

            <label>Gender</label>
            <select
              value={editData.gender}
              onChange={(e) => handleEditChange("gender", e.target.value)}
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>

            <button onClick={handleSaveChanges}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
