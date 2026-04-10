const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');

// ── Get communities ──────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { q, category } = req.query;
    let filter = { privacy: 'public' };
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (category) filter.category = category;

    const communities = await Community.find(filter)
      .populate('creator', 'name username avatar')
      .sort({ memberCount: -1 })
      .limit(30);

    res.json({ success: true, communities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get my communities ───────────────────────────────────
router.get('/mine', protect, async (req, res) => {
  try {
    const communities = await Community.find({ members: req.user._id })
      .populate('creator', 'name username avatar')
      .sort({ updatedAt: -1 });
    res.json({ success: true, communities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Create community ─────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, emoji, category, privacy, tags } = req.body;

    const chat = await Chat.create({
      name: `${name} Community`,
      isGroup: true,
      participants: [req.user._id],
      admins: [req.user._id],
    });

    const community = await Community.create({
      name, description, emoji, category, privacy, tags,
      creator: req.user._id,
      admins: [req.user._id],
      members: [req.user._id],
      memberCount: 1,
      chat: chat._id,
    });

    res.status(201).json({ success: true, community });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Join community ───────────────────────────────────────
router.post('/:id/join', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, message: 'Not found' });

    if (community.members.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    community.members.push(req.user._id);
    community.memberCount = community.members.length;
    await community.save();

    if (community.chat) {
      await Chat.findByIdAndUpdate(community.chat, { $addToSet: { participants: req.user._id } });
    }

    res.json({ success: true, message: 'Joined community' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Leave community ──────────────────────────────────────
router.post('/:id/leave', protect, async (req, res) => {
  try {
    await Community.findByIdAndUpdate(req.params.id, {
      $pull: { members: req.user._id },
      $inc: { memberCount: -1 },
    });
    res.json({ success: true, message: 'Left community' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get single community ─────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('creator', 'name username avatar')
      .populate('members', 'name username avatar isOnline');
    if (!community) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, community });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
