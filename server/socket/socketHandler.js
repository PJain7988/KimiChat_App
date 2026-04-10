const Message = require('../models/Message');
const GlobalMessage = require('../models/GlobalMessage');
const Chat = require('../models/Chat');
const User = require('../models/User');

// AI reply pool
const AI_REPLIES = [
  "I understand! Let me help you with that. 🤖",
  "Great question! Here's what I think: based on the context, you might want to consider multiple approaches.",
  "Absolutely! I'm here to assist. Could you share more details so I can give you the best answer?",
  "Interesting! I've processed your message. Here's my analysis and suggestions for you.",
  "Of course! As your AI assistant, I'm always ready. Let me break this down for you step by step.",
  "Thanks for asking! This is a fascinating topic. Let me walk you through everything I know about it.",
  "Sure thing! I'll help you figure this out. Here's the most efficient way to approach this situation.",
];

module.exports = (io) => {
  // Track online users: userId -> socketId
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── User comes online ─────────────────────────────────
    socket.on('user:online', async (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;

      await User.findByIdAndUpdate(userId, { isOnline: true, socketId: socket.id });

      // Broadcast to all
      io.emit('user:status', { userId, isOnline: true });
      console.log(`✅ User online: ${userId}`);
    });

    // ── Join chat rooms ───────────────────────────────────
    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('chat:leave', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // ── Send message ──────────────────────────────────────
    socket.on('message:send', async (data) => {
      try {
        const { chatId, senderId, content, type = 'text', fileUrl, replyTo } = data;

        const message = await Message.create({
          chat: chatId,
          sender: senderId,
          content,
          type,
          fileUrl,
          replyTo,
          readBy: [senderId],
        });

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        const populated = await message.populate('sender', 'name username avatar avatarColor');

        // Emit to all in chat room
        io.to(`chat:${chatId}`).emit('message:new', populated);

        // Check if AI chat
        const chat = await Chat.findById(chatId);
        if (chat?.isAI) {
          // Simulate AI typing
          setTimeout(() => {
            io.to(`chat:${chatId}`).emit('typing:start', { chatId, userId: 'ai', name: 'Kimi AI' });
          }, 300);

          setTimeout(async () => {
            io.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId: 'ai' });

            const aiReply = AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)];
            const aiMsg = await Message.create({
              chat: chatId,
              sender: senderId, // placeholder – real app uses a bot user
              content: aiReply,
              type: 'ai',
              isAI: true,
              readBy: [senderId],
            });

            await Chat.findByIdAndUpdate(chatId, { lastMessage: aiMsg._id });

            const populatedAI = await aiMsg.populate('sender', 'name username avatar avatarColor');
            io.to(`chat:${chatId}`).emit('message:new', { ...populatedAI.toObject(), isAI: true });
          }, 1800 + Math.random() * 1000);
        }

      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Typing indicators ─────────────────────────────────
    socket.on('typing:start', ({ chatId, userId, name }) => {
      socket.to(`chat:${chatId}`).emit('typing:start', { chatId, userId, name });
    });

    socket.on('typing:stop', ({ chatId, userId }) => {
      socket.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId });
    });

    // ── Message read ──────────────────────────────────────
    socket.on('message:read', async ({ chatId, userId }) => {
      await Message.updateMany(
        { chat: chatId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      io.to(`chat:${chatId}`).emit('message:read', { chatId, userId });
    });

    // ── Global chat rooms ─────────────────────────────────
    socket.on('global:join', (room) => {
      socket.join(`global:${room}`);
    });

    socket.on('global:leave', (room) => {
      socket.leave(`global:${room}`);
    });

    socket.on('global:message', async (data) => {
      try {
        const { room, senderId, content, type = 'text' } = data;

        const message = await GlobalMessage.create({
          room,
          sender: senderId,
          content,
          type,
        });

        const populated = await message.populate('sender', 'name username avatar avatarColor');
        io.to(`global:${room}`).emit('global:message', populated);

      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── WebRTC Signaling ──────────────────────────────────
    socket.on('call:initiate', ({ targetUserId, callerId, callerName, callerAvatar, callType }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      if (targetSocket) {
        io.to(targetSocket).emit('call:incoming', {
          callerId,
          callerName,
          callerAvatar,
          callType,
          socketId: socket.id,
        });
      } else {
        socket.emit('call:unavailable', { targetUserId });
      }
    });

    socket.on('call:accept', ({ callerSocketId, callType }) => {
      io.to(callerSocketId).emit('call:accepted', { callType });
    });

    socket.on('call:reject', ({ callerSocketId }) => {
      io.to(callerSocketId).emit('call:rejected');
    });

    socket.on('call:end', ({ targetSocketId }) => {
      if (targetSocketId) io.to(targetSocketId).emit('call:ended');
    });

    // WebRTC offer/answer/ice
    socket.on('webrtc:offer', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('webrtc:offer', { offer, fromSocketId: socket.id });
    });

    socket.on('webrtc:answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('webrtc:answer', { answer });
    });

    socket.on('webrtc:ice', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('webrtc:ice', { candidate });
    });

    // ── Status updates ────────────────────────────────────
    socket.on('status:new', (statusData) => {
      // Broadcast to friends – in real app filter by friendIds
      socket.broadcast.emit('status:new', statusData);
    });

    // ── Disconnect ────────────────────────────────────────
    socket.on('disconnect', async () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
          socketId: '',
        });
        io.emit('user:status', { userId: socket.userId, isOnline: false, lastSeen: new Date() });
        console.log(`❌ User offline: ${socket.userId}`);
      }
    });
  });
};
