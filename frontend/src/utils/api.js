import axios from 'axios';

const envBase = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL;
const baseURL = (envBase && envBase.trim()) || 'http://localhost:5001/api';
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  // Add JWT token from localStorage to all requests
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;
