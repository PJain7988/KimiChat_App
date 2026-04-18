import { create } from 'zustand';
import api from '../utils/api';
import { initSocket, disconnectSocket } from '../utils/socket';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('kimi_user') || localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('kimi_token') || localStorage.getItem('token') || null,
  loading: false,
  error: null,

  setUser: (user) => {
    localStorage.setItem('kimi_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', data);
      const { token, user } = res.data;
      localStorage.setItem('kimi_token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('kimi_user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      initSocket(user._id);
      set({ token, user, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('kimi_token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('kimi_user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      initSocket(user._id);
      set({ token, user, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  verifyOtp: async (phone, otp) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp });
      const { token, user } = res.data;
      localStorage.setItem('kimi_token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('kimi_user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      initSocket(user._id);
      set({ token, user, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem('kimi_token');
    localStorage.removeItem('kimi_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    set({ user: null, token: null });
  },

  initAuth: () => {
    const user = get().user;
    if (user) initSocket(user._id);
  },
}));

export default useAuthStore;
