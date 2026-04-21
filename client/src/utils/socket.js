import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  const token = localStorage.getItem('kimi_token');
  
  if (socket?.connected) {
    if (token) socket.auth = { token };
    return socket;
  }

  // Create socket if not exists or not connected
  socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
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
