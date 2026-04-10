const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ── Socket.IO Setup ──────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Database ─────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/messages',  require('./routes/messages'));
app.use('/api/chats',     require('./routes/chats'));
app.use('/api/friends',   require('./routes/friends'));
app.use('/api/community', require('./routes/community'));
app.use('/api/status',    require('./routes/status'));
app.use('/api/global',    require('./routes/global'));

// ── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'KimiChat API running 🚀' }));

// ── Socket.IO Logic ──────────────────────────────────────
const socketHandler = require('./socket/socketHandler');
socketHandler(io);

// ── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 KimiChat Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
});

module.exports = { app, io };
