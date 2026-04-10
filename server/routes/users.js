const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ── Search Users ─────────────────────────────────────────
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, users: [] });

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { kimichatId: { $regex: q, $options: 'i' } },
      ],
    }).select('name username avatar avatarColor isOnline kimichatId bio').limit(20);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Random User Discovery ────────────────────────────────
router.get('/random', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const excludeIds = [req.user._id, ...me.friends, ...me.sentRequests];

    const users = await User.aggregate([
      { $match: { _id: { $nin: excludeIds }, 'settings.privacy': { $ne: 'private' } } },
      { $sample: { size: 5 } },
      { $project: { name:1, username:1, avatar:1, avatarColor:1, bio:1, isOnline:1, kimichatId:1 } },
    ]);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get User Profile ─────────────────────────────────────
router.get('/:username', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -otp -otpExpiry -socketId')
      .populate('friends', 'name username avatar avatarColor isOnline');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Update Profile ───────────────────────────────────────
router.put('/update/profile', protect, async (req, res) => {
  try {
    const { name, bio, avatar, avatarColor, settings } = req.body;
    const update = {};
    if (name)        update.name = name;
    if (bio)         update.bio = bio;
    if (avatar)      update.avatar = avatar;
    if (avatarColor) update.avatarColor = avatarColor;
    if (settings)    update.settings = { ...req.user.settings, ...settings };

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json({ success: true, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
