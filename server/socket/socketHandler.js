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
    socket.on('user:online', async (rawUserId) => {
      if (!rawUserId) {
        console.error('❌ [SOCKET] user:online called without userId');
        return;
      }
      const userId = String(rawUserId);
      onlineUsers.set(userId, socket.id);
      
      socket.data.userId = userId; 
      socket.userId = userId; 
      
      const userRoom = `user:${userId}`;
      socket.join(userRoom); 

      await User.findByIdAndUpdate(userId, { isOnline: true, socketId: socket.id });

      io.emit('user:status', { userId, isOnline: true });
      console.log(`✅ [SOCKET] User ${userId} is online and joined room: ${userRoom}`);
      
      socket.emit('socket:registered', { userId });
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
        io.to(`chat:${chatId}`).emit('message:new', { chatId, message: populated });

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

    socket.on('global:invite', (data) => {
      const { targetUserId } = data;
      io.to(`user:${targetUserId}`).emit('global:invite', data);
    });

    // ── WebRTC Signaling ──────────────────────────────────
    socket.on('call:initiate', async ({ targetUserId, type }) => {
      const targetId = String(targetUserId);
      const callerId = String(socket.userId);
      
      console.log(`📞 [CALL] ${callerId} is calling ${targetId} (type: ${type})`);

      const caller = await User.findById(callerId).select('_id name username avatar avatarColor');
      if (caller) {
        // Emit to target user's room
        // 1. Try Room-based delivery (Primary)
        const targetRoom = `user:${targetId}`;
        console.log(`📡 [CALL] Attempting primary delivery to room: ${targetRoom}`);
        io.to(targetRoom).emit('call:incoming', { from: caller, type });

        // 2. Fallback: Search all sockets for the matching userId property
        // This handles cases where room joining might have failed or lagged
        const allSockets = await io.fetchSockets();
        let fallbackSent = 0;
        for (const s of allSockets) {
          if (String(s.userId) === targetId || String(s.data?.userId) === targetId) {
            console.log(`🔗 [CALL] Fallback match found on socket ${s.id}. Sending signal...`);
            io.to(s.id).emit('call:incoming', { from: caller, type });
            fallbackSent++;
          }
        }

        // 3. Ultimate Fallback: Broadcast to EVERYONE (Diagnostic Only - Remove after testing)
        // console.log('📢 [DIAGNOSTIC] Broadcasting to ALL sockets as fallback');
        // io.emit('call:incoming', { from: caller, type, isGlobalBroadcast: true });

        if (fallbackSent === 0) {
          console.warn(`⚠️ [CALL] No active sockets found for user ${targetId} via room or property search. Target may be offline.`);
          // Silent debug broadcast to help identify if client is listening at all
          io.emit('call:debug', { targetId, from: caller.name });
        } else {
          console.log(`✅ [CALL] Signal delivered via ${fallbackSent} socket matches`);
        }
      } else {
        console.error(`❌ [CALL] Caller ${callerId} not found in database`);
        socket.emit('error', { message: 'Signaling error: Caller not found' });
      }
    });

    socket.on('call:accept', ({ targetUserId }) => {
      const targetId = String(targetUserId);
      console.log(`✅ [CALL] Accepted by recipient, notifying caller: ${targetId}`);
      io.to(`user:${targetId}`).emit('call:accepted', { fromUserId: socket.userId });
    });

    socket.on('call:reject', ({ targetUserId }) => {
      const targetId = String(targetUserId);
      console.log(`❌ [CALL] Rejected by recipient, notifying caller: ${targetId}`);
      io.to(`user:${targetId}`).emit('call:rejected', { fromUserId: socket.userId });
    });

    socket.on('call:end', ({ targetUserId }) => {
      const targetId = String(targetUserId);
      console.log(`📴 [CALL] Ended, notifying other party: ${targetId}`);
      io.to(`user:${targetId}`).emit('call:ended', { fromUserId: socket.userId });
    });

    // WebRTC offer/answer/ice
    socket.on('webrtc:offer', ({ targetSocketId, targetUserId, offer }) => {
      const room = targetUserId ? `user:${String(targetUserId)}` : targetSocketId;
      console.log(`📤 RTC Offer to ${room}`);
      io.to(room).emit('webrtc:offer', { offer, fromSocketId: socket.id, fromUserId: socket.userId });
    });

    socket.on('webrtc:answer', ({ targetSocketId, targetUserId, answer }) => {
      const room = targetUserId ? `user:${String(targetUserId)}` : targetSocketId;
      console.log(`📥 RTC Answer to ${room}`);
      io.to(room).emit('webrtc:answer', { answer });
    });

    socket.on('webrtc:ice', ({ targetSocketId, targetUserId, candidate }) => {
      const room = targetUserId ? `user:${String(targetUserId)}` : targetSocketId;
      io.to(room).emit('webrtc:ice', { candidate });
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
