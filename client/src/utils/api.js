import axios from 'axios';

let serverBase = import.meta.env.VITE_SERVER_URL || 'https://kimichat-app.onrender.com';

// Self-healing: If we are not in a known development environment, but URL is localhost, switch to production
if (typeof window !== 'undefined') {
  const isDev = window.location.hostname === 'localhost' && (window.location.port === '5173' || window.location.port === '3000');
  if (!isDev && (serverBase.includes('localhost') || serverBase.includes('127.0.0.1'))) {
    serverBase = 'https://kimichat-app.onrender.com';
  }
}

// Detection logic for absolute vs relative path
const isNative = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' ||
  window.location.protocol === 'capacitor:' ||
  (window.location.hostname === 'localhost' && window.location.port !== '5173' && window.location.port !== '3000')
);

const api = axios.create({
  baseURL: isNative ? `${serverBase}/api` : '/api',
  withCredentials: true,
});

 
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kimi_token') || localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

 
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kimi_token');
      localStorage.removeItem('kimi_user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;
