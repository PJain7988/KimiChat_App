const express = require('express');
const router = express.Router();
const GlobalMessage = require('../models/GlobalMessage');
const { protect } = require('../middleware/auth');

router.get('/rooms', protect, (req, res) => {
  res.json({ success: true, rooms: [
    { id: 'general',    name: 'General',      emoji: '🌍', members: 2847 },
    { id: 'tech-talk',  name: 'Tech Talk',    emoji: '💻', members: 1203 },
    { id: 'gaming',     name: 'Gaming Zone',  emoji: '🎮', members: 987  },
    { id: 'music',      name: 'Music Vibes',  emoji: '🎵', members: 654  },
    { id: 'art-design', name: 'Art & Design', emoji: '🎨', members: 432  },
  ]});
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
