import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  const token = localStorage.getItem('kimi_token');
  
  if (socket?.connected) {
    if (token) socket.auth = { token };
    return socket;
  }

   
  socket = io(import.meta.env.VITE_SERVER_URL || 'https://kimichat-app.onrender.com', {
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
