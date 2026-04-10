const express = require('express');
const statusRouter = express.Router();
const globalRouter = express.Router();
const Status = require('../models/Status');
const GlobalMessage = require('../models/GlobalMessage');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ══ STATUS ROUTES ════════════════════════════════════════

statusRouter.get('/', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const friendIds = [...me.friends, req.user._id];

    const statuses = await Status.find({
      user: { $in: friendIds },
      expiresAt: { $gt: new Date() },
    })
      .populate('user', 'name username avatar avatarColor')
      .sort({ createdAt: -1 });

    // Group by user
    const grouped = {};
    statuses.forEach(s => {
      const uid = s.user._id.toString();
      if (!grouped[uid]) grouped[uid] = { user: s.user, statuses: [] };
      grouped[uid].statuses.push(s);
    });

    res.json({ success: true, statusGroups: Object.values(grouped) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

statusRouter.post('/', protect, async (req, res) => {
  try {
    const { type, content, bg, emoji } = req.body;
    const status = await Status.create({ user: req.user._id, type, content, bg, emoji });
    res.status(201).json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

statusRouter.post('/:id/view', protect, async (req, res) => {
  try {
    await Status.findByIdAndUpdate(req.params.id, { $addToSet: { viewers: req.user._id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

statusRouter.delete('/:id', protect, async (req, res) => {
  try {
    await Status.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = statusRouter;
