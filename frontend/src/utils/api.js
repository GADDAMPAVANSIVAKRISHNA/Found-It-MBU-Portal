import axios from 'axios';

const baseURL = 'http://localhost:5000/api';
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
