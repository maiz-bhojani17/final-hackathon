import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hcm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle forced password change and session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if not already there
      localStorage.removeItem('hcm_token');
      localStorage.removeItem('hcm_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/setup') {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403 && error.response?.data?.mustChangePassword) {
      // Trigger event or modal for forced password update
      window.dispatchEvent(new CustomEvent('hcm_must_change_password'));
    }
    return Promise.reject(error);
  }
);

export default api;
