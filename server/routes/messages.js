const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');
const { triggerAIReply } = require('../services/aiService');

router.post('/', protect, async (req, res) => {
  try {
    const { chatId, content, type = 'text', fileUrl, sticker, replyTo } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content,
      type,
      fileUrl,
      sticker,
      replyTo,
      readBy: [req.user._id],
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    const populated = await message.populate('sender', 'name username avatar avatarColor');

    if (chat.isAI && type === 'text') {
      const io = req.app.get('io');
      triggerAIReply(io, chatId, content).catch(err => console.error('AI Reply Error:', err));
    }

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/react', protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const existing = message.reactions.find(r => r.user.toString() === req.user._id.toString());
    if (existing) {
      existing.emoji = emoji;
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }
    await message.save();
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Not found' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    message.deleted = true;
    message.content = 'This message was deleted';
    await message.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
