import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle Unauthorized
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    // Handle License Expiry (402 Payment Required)
    if (error.response?.status === 402 && error.response?.data?.license_expired) {
      if (!window.location.pathname.includes('/license-expired')) {
        window.location.href = '/license-expired';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;