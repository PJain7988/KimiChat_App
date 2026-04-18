const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// ── Get all chats for user ───────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name username avatar avatarColor isOnline lastSeen')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json({ success: true, chats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Create/Get direct chat ───────────────────────────────
router.post('/direct', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    let chat = await Chat.findOne({
      isGroup: false,
      isAI: false,
      participants: { $all: [req.user._id, userId], $size: 2 },
    }).populate('participants', 'name username avatar avatarColor isOnline lastSeen');

    if (!chat) {
      chat = await Chat.create({ participants: [req.user._id, userId] });
      chat = await chat.populate('participants', 'name username avatar avatarColor isOnline lastSeen');
    }

    res.json({ success: true, chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Create group chat ────────────────────────────────────
router.post('/group', protect, async (req, res) => {
  try {
    const { name, participants, description, avatar } = req.body;

    const allParticipants = [...new Set([req.user._id.toString(), ...participants])];

    const chat = await Chat.create({
      name,
      description,
      avatar,
      isGroup: true,
      participants: allParticipants,
      admins: [req.user._id],
    });

    const populated = await chat.populate('participants', 'name username avatar avatarColor isOnline');
    res.status(201).json({ success: true, chat: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get chat messages ────────────────────────────────────
router.get('/:chatId/messages', protect, async (req, res) => {
  try {
    const { page = 1, limit = 40 } = req.query;

    const messages = await Message.find({ chat: req.params.chatId, deleted: false })
      .populate('sender', 'name username avatar avatarColor')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Mark as read
    await Message.updateMany(
      { chat: req.params.chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Delete chat ──────────────────────────────────────────
router.delete('/:chatId', protect, async (req, res) => {
  try {
    await Chat.findByIdAndUpdate(req.params.chatId, {
      $pull: { participants: req.user._id }
    });
    res.json({ success: true, message: 'Chat removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Create/Get AI chat ───────────────────────────────────────
router.post('/ai', protect, async (req, res) => {
  try {
    let chat = await Chat.findOne({
      isAI: true,
      participants: req.user._id,
    }).populate('participants', 'name username avatar avatarColor');

    if (!chat) {
      chat = await Chat.create({
        name: 'Kimi AI Assistant',
        isAI: true,
        participants: [req.user._id],
        avatar: '🤖',
        description: 'Your personal AI companion for help and conversation.',
      });
      chat = await chat.populate('participants', 'name username avatar avatarColor');
    }

    res.json({ success: true, chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
