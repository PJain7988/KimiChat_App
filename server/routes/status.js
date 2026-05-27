const express = require('express');
const statusRouter = express.Router();
const upload = require('../config/multer');
const Status = require('../models/Status');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

statusRouter.get('/', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    if (!me) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const friendIds = [me._id];
    if (Array.isArray(me.friends)) {
      me.friends.forEach(fId => {
        if (fId) friendIds.push(fId);
      });
    }

    const statuses = await Status.find({})
      .populate('userId', 'name username avatar avatarColor')
      .populate('reactions.user', 'name avatar')
      .populate('replies.userId', 'name avatar')
      .populate('views', 'name avatar')
      .sort({ createdAt: -1 });

    const grouped = {};
    statuses.forEach((s) => {
      if (!s.userId) return;

            const uid = s.userId._id ? s.userId._id.toString() : s.userId.toString();

            if (!grouped[uid]) {
        grouped[uid] = { 
          user: s.userId._id ? s.userId : { _id: uid, name: 'Unknown User' }, 
          statuses: [] 
        };
      }
      grouped[uid].statuses.push(s);
    });

    res.json({
      success: true,
      statusGroups: Object.values(grouped),
    });
  } catch (err) {
    console.error('❌ GET /status error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statuses',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

statusRouter.post('/', protect, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'songFile', maxCount: 1 },
]), async (req, res) => {
  try {
    const { type, content, bg } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'Type required' });

    const file = req.files?.file?.[0]?.filename;
    const songFile = req.files?.songFile?.[0]?.filename;

    const status = await Status.create({
      userId: req.user._id,
      type,
      content: content?.trim() || '',
      bg: bg || 'linear-gradient(135deg,#00c9b1,#1a8cff)',
      fileUrl: file ? `/uploads/${file}` : null,
      songUrl: songFile ? `/uploads/${songFile}` : null,
      fileName: req.files?.file?.[0]?.originalname,
      songFileName: req.files?.songFile?.[0]?.originalname,
    });

    await status.populate('userId', 'name username avatar avatarColor');
    res.status(201).json({ success: true, status });
  } catch (err) {
    console.error('❌ POST / status error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

statusRouter.put('/:id/reaction', protect, async (req, res) => {
  try {
    const { reactionType } = req.body;
    await Status.findByIdAndUpdate(req.params.id, {
      $pull: { reactions: { user: req.user._id } }
    });

    const status = await Status.findByIdAndUpdate(
      req.params.id,
      { $push: { reactions: { user: req.user._id, type: reactionType } } },
      { new: true }
    )
      .populate('userId', 'name username avatar avatarColor')
      .populate('reactions.user', 'name avatar');

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

statusRouter.put('/:id/view', protect, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) return res.status(404).json({ success: false, message: 'Status not found' });

    if (status.userId.toString() === req.user._id.toString()) {
      return res.json({ success: true, message: 'Owner view' });
    }

    await Status.findByIdAndUpdate(req.params.id, {
      $addToSet: { views: req.user._id }
    });

    res.json({ success: true, viewed: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

statusRouter.post('/:id/reply', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const status = await Status.findByIdAndUpdate(
      req.params.id,
      { $push: { replies: { userId: req.user._id, message } } },
      { new: true }
    )
      .populate('userId', 'name username avatar avatarColor')
      .populate('replies.userId', 'name avatar');

          res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

statusRouter.delete('/:id', protect, async (req, res) => {
  try {
    const status = await Status.findOne({ _id: req.params.id, userId: req.user._id });
    if (!status) return res.status(404).json({ success: false, message: 'Not found or unauthorized' });

    const cleanup = (url) => {
      if (!url) return;
      const fullPath = path.join(__dirname, '..', url);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    };
    cleanup(status.fileUrl);
    cleanup(status.songUrl);

    await Status.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = statusRouter;