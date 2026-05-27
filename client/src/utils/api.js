import axios from 'axios';

let serverBase = import.meta.env.VITE_SERVER_URL || 'https://kimichat-app.onrender.com';

// Self-healing: If we are not in a known development environment, but URL is localhost or internal IP, switch to production
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isDev = (hostname === 'localhost' || hostname === '127.0.0.1') && 
                (window.location.port === '5173' || window.location.port === '3000');
                
  if (!isDev && (serverBase.includes('localhost') || serverBase.includes('127.0.0.1') || serverBase.includes('10.95.141.72'))) {
    console.log('🔄 API Self-healing: Switching to production Render URL');
    serverBase = 'https://kimichat-app.onrender.com';
  }
}

// Detection logic for absolute vs relative path (True native only)
const isNative = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' ||
  window.location.protocol === 'capacitor:'
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
