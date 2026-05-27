const express = require('express');
const router = express.Router();
const GlobalMessage = require('../models/GlobalMessage');
const GlobalRoom = require('../models/GlobalRoom');
const { protect } = require('../middleware/auth');

router.get('/rooms', protect, async (req, res) => {
  try {
    const defaultRooms = [
      { id: 'general',    name: 'General',      emoji: '🌍', type: 'public', membersCount: 2847 },
      { id: 'tech-talk',  name: 'Tech Talk',    emoji: '💻', type: 'public', membersCount: 1203 },
      { id: 'gaming',     name: 'Gaming Zone',  emoji: '🎮', type: 'public', membersCount: 987  },
      { id: 'music',      name: 'Music Vibes',  emoji: '🎵', type: 'public', membersCount: 654  },
      { id: 'art-design', name: 'Art & Design', emoji: '🎨', type: 'public', membersCount: 432  },
    ];

    for (const dr of defaultRooms) {
      await GlobalRoom.findOneAndUpdate(
        { id: dr.id },
        { 
          $set: { type: 'public' }, 
          $setOnInsert: { 
            name: dr.name, 
            emoji: dr.emoji, 
            membersCount: dr.membersCount 
          }
        },
        { upsert: true, new: true }
      );
    }

    const rooms = await GlobalRoom.find({ 
      $or: [
        { type: 'public' },
        { members: req.user._id }
      ]
    }).sort({ createdAt: 1 });

        res.json({ success: true, rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/rooms', protect, async (req, res) => {
  try {
    const { name, emoji, id, description, category, type, isNSFW, slowMode } = req.body;

    const roomId = id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

        const existing = await GlobalRoom.findOne({ id: roomId });
    if (existing) return res.status(400).json({ success: false, message: 'Room ID already exists' });

    const room = await GlobalRoom.create({
      id: roomId,
      name,
      emoji: emoji || '🌐',
      description,
      category: category || 'General',
      type: type || 'public',
      isNSFW: !!isNSFW,
      slowMode: Number(slowMode) || 0,
      createdBy: req.user._id,
      members: [req.user._id],
      membersCount: 1
    });

        res.status(201).json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/rooms/:roomId/members', protect, async (req, res) => {
  try {
    const room = await GlobalRoom.findOne({ id: req.params.roomId }).populate('members', 'name username avatar avatarColor');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

        const members = room.members.map(m => ({
       _id: m._id,
       name: m.name,
       username: m.username,
       avatar: m.avatar,
       avatarColor: m.avatarColor,
       status: 'online',
       role: m._id.toString() === room.createdBy?.toString() ? 'Owner' : 'Member'
    }));

    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/rooms/:roomId', protect, async (req, res) => {
  try {
    const room = await GlobalRoom.findOne({ id: req.params.roomId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    if (room.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the room creator can delete this room' });
    }

    await GlobalRoom.deleteOne({ id: req.params.roomId });
    await GlobalMessage.deleteMany({ room: req.params.roomId });

        res.json({ success: true, message: 'Room and all messages deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/rooms/:roomId/join', protect, async (req, res) => {
  try {
    const room = await GlobalRoom.findOne({ id: req.params.roomId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    if (room.members.includes(req.user._id)) {
      return res.json({ success: true, message: 'Already a member', room });
    }

    room.members.push(req.user._id);
    room.membersCount = (room.membersCount || 0) + 1;
    await room.save();

        res.json({ success: true, message: 'Joined successfully', room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:room/messages', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await GlobalMessage.find({ room: req.params.room, deleted: false })
      .populate('sender', 'name username avatar avatarColor')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:room/messages', protect, async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    const message = await GlobalMessage.create({
      room: req.params.room,
      sender: req.user._id,
      content,
      type,
    });
    const populated = await message.populate('sender', 'name username avatar avatarColor');
    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
