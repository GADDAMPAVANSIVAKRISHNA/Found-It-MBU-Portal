import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { auth } from '../lib/firebase';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [stats, setStats] = useState({ lost: 0, found: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const response = await api.get('/dashboard', {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` }
      });

      const data = response.data;
      setUserData(data.userProfile);
      setEditData(data.userProfile);
      setStats({
        lost: data.myItems?.lost?.length || 0,
        found: data.myItems?.found?.length || 0,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      const user = auth.currentUser;
      await api.put('/profile', editData, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` }
      });
      setUserData(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-bg"></div>
      
      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-card">
          <div className="welcome-header">
            <div className="user-greeting">
              <h1>Welcome, <span className="user-name">{userData?.fullName || 'User'}</span>!</h1>
              <p className="user-email">{userData?.email}</p>
            </div>
            <button 
              className="edit-profile-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>

          {/* User Details */}
          <div className="user-details-row">
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{userData?.email || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Branch</span>
              <span className="detail-value">{userData?.branch || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Year</span>
              <span className="detail-value">{userData?.year || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Gender</span>
              <span className="detail-value">{userData?.gender || '—'}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">{stats.lost}</div>
            <div className="stat-text">Lost Items Reported</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.found}</div>
            <div className="stat-text">Found Items Reported</div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => {
          setIsEditing(false);
          setEditData(userData);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setIsEditing(false);
                  setEditData(userData);
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
                    value={editData.fullName || ''}
                    onChange={(e) => handleEditChange('fullName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Branch</label>
                  <input
                    type="text"
                    value={editData.branch || ''}
                    onChange={(e) => handleEditChange('branch', e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-row">
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="text"
                    value={editData.year || ''}
                    onChange={(e) => handleEditChange('year', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={editData.gender || ''}
                    onChange={(e) => handleEditChange('gender', e.target.value)}
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
                  setEditData(userData);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSaveChanges}
              >
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
