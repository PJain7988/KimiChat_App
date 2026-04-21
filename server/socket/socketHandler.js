const Message = require('../models/Message');
const GlobalMessage = require('../models/GlobalMessage');
const Chat = require('../models/Chat');
const User = require('../models/User');

 
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
   
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

     
    socket.on('user:online', async (rawUserId) => {
      const userId = String(rawUserId);
      onlineUsers.set(userId, socket.id);
      
       
      socket.join(`user:${userId}`);
      socket.join(userId); 
      socket.join('authenticated-users');
      
      socket.data.userId = userId; 
      socket.userId = userId; 
      
      await User.findByIdAndUpdate(userId, { isOnline: true, socketId: socket.id });
      io.emit('user:status', { userId, isOnline: true });
      socket.emit('socket:registered', { userId });
      console.log(`📡 [SOCKET] User ${userId} joined signaling rooms.`);
    });

     
    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('chat:leave', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

     
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

         
        io.to(`chat:${chatId}`).emit('message:new', { chatId, message: populated });

      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

     
    socket.on('typing:start', ({ chatId, userId, name }) => {
      socket.to(`chat:${chatId}`).emit('typing:start', { chatId, userId, name });
    });

    socket.on('typing:stop', ({ chatId, userId }) => {
      socket.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId });
    });

     
    socket.on('message:read', async ({ chatId, userId }) => {
      await Message.updateMany(
        { chat: chatId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      io.to(`chat:${chatId}`).emit('message:read', { chatId, userId });
    });

     
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

     
    socket.on('call:initiate', async ({ targetUserId, type }) => {
      const targetId = String(targetUserId);
      const callerId = String(socket.userId || socket.data?.userId);
      
       
      if (targetId === callerId) {
        console.warn(`🛑 [CALL] User ${callerId} tried to call themselves.`);
        return socket.emit('error', { message: "You cannot call yourself." });
      }

      console.log(`📞 [CALL] Initiate: ${callerId} calling ${targetId} (${type})`);

      const caller = await User.findById(callerId).select('_id name username avatar avatarColor');
      if (caller) {
        let sentCount = 0;
        const allSockets = await io.fetchSockets();
        
        for (const s of allSockets) {
          const sid = String(s.data?.userId || s.userId || "");
          if (sid === targetId) {
            console.log(`📡 [CALL] Direct emission to PJ (Socket: ${s.id})`);
            s.emit('call:incoming', { from: caller.toPublic(), type });
            sentCount++;
          }
        }

         
        const target = await User.findById(targetId).select('name');
        const signalData = { 
          from: caller.toPublic(), 
          callerName: caller.name,
          targetName: target?.name || 'User',
          type, 
          targetUserId: targetId 
        };
        
        const room1 = `user:${targetId}`;
        const room2 = targetId;
        
        console.log(`📡 [CALL] Emitting to ${target?.name} rooms: ${room1}, ${room2}`);
        
        io.to(room1).emit('call:incoming', signalData);
        io.to(room2).emit('call:incoming', signalData);
        
         
        io.emit('call:incoming:broadcast', signalData);

        if (sentCount === 0) {
          console.warn(`⚠️ [CALL] PJ (user ${targetId}) has no active direct sockets.`);
        }
      } else {
        socket.emit('error', { message: 'Signaling error: Caller profile not found' });
      }
    });

    socket.on('call:accept', ({ targetUserId }) => {
      const targetId = String(targetUserId);
      console.log(`✅ [CALL] Accepted by PJ for ${targetId}`);
      const acceptance = { fromUserId: socket.userId };
      io.to(`user:${targetId}`).emit('call:accepted', acceptance);
      io.to(targetId).emit('call:accepted', acceptance);
      io.emit('call:accepted:internal', { targetUserId: targetId, ...acceptance });
    });

    socket.on('call:reject', ({ targetUserId }) => {
      const targetId = String(targetUserId);
      console.log(`❌ SIGNAL: Rejected call for ${targetId}`);
      io.to(`user:${targetUserId}`).emit('call:rejected');
    });

    socket.on('call:end', ({ targetUserId }) => {
      const targetId = String(targetUserId);
      console.log(`📴 SIGNAL: Ended call for ${targetId}`);
      io.to(`user:${targetId}`).emit('call:ended');
    });

     
    socket.on('call:signal', ({ targetUserId, targetSocketId, signal }) => {
      const room = targetUserId ? `user:${String(targetUserId)}` : targetSocketId;
      console.log(`📡 [RTC] Signal forwarded from ${socket.userId} to ${room}`);
      io.to(room).emit('call:signal', { signal, fromUserId: socket.userId, fromSocketId: socket.id });
       
      if (targetUserId) io.to(String(targetUserId)).emit('call:signal', { signal, fromUserId: socket.userId });
    });

     
    socket.on('status:new', (statusData) => {
       
      socket.broadcast.emit('status:new', statusData);
    });

     
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
