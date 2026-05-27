const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'name username avatar avatarColor isOnline lastSeen bio kimichatId');
    res.json({ success: true, friends: user.friends });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/requests', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests.from', 'name username avatar avatarColor bio kimichatId');
    res.json({ success: true, requests: user.friendRequests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/request/:userId', protect, async (req, res) => {
  try {
    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    if (target.friends.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }

    const alreadySent = target.friendRequests.some(r => r.from.toString() === req.user._id.toString());
    if (alreadySent) return res.status(400).json({ success: false, message: 'Request already sent' });

    target.friendRequests.push({ from: req.user._id });
    await target.save();

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { sentRequests: target._id } });

    res.json({ success: true, message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/accept/:userId', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const them = await User.findById(req.params.userId);

    if (!them) return res.status(404).json({ success: false, message: 'User not found' });

    me.friendRequests = me.friendRequests.filter(r => r.from.toString() !== them._id.toString());
    me.friends.addToSet(them._id);
    await me.save();

    them.friends.addToSet(me._id);
    them.sentRequests = them.sentRequests.filter(id => id.toString() !== me._id.toString());
    await them.save();

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/request/:userId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { friendRequests: { from: req.params.userId } }
    });
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { sentRequests: req.user._id }
    });
    res.json({ success: true, message: 'Request removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:userId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { friends: req.params.userId } });
    await User.findByIdAndUpdate(req.params.userId, { $pull: { friends: req.user._id } });
    res.json({ success: true, message: 'Unfriended' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/blocked', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'name username avatar avatarColor bio kimichatId');
    res.json({ success: true, blocked: user.blockedUsers || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/block/:userId', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot block yourself' });
    }

    me.blockedUsers.addToSet(req.params.userId);
    me.friends = me.friends.filter(id => id.toString() !== req.params.userId);
    me.friendRequests = me.friendRequests.filter(r => r.from.toString() !== req.params.userId);
    me.sentRequests = me.sentRequests.filter(id => id.toString() !== req.params.userId);

        await me.save();

    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { friends: req.user._id, sentRequests: req.user._id }
    });

    res.json({ success: true, message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/unblock/:userId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: req.params.userId }
    });
    res.json({ success: true, message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
