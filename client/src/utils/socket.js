import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  const token = localStorage.getItem('kimi_token');
  
  if (socket?.connected) {
    if (token) socket.auth = { token };
    return socket;
  }

   
  let serverUrl = import.meta.env.VITE_SERVER_URL || 'https://kimichat-app.onrender.com';
  
  // Logic to prevent connecting to localhost if we are on a production domain
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    if (serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1')) {
      serverUrl = 'https://kimichat-app.onrender.com';
    }
  }

  socket = io(serverUrl, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket error:', err.message);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
