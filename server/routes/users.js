const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

 
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

 
router.get('/random', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    
     
    const excludeIds = [req.user._id];
    if (me.friends) me.friends.forEach(f => excludeIds.push(f));
    if (me.sentRequests) me.sentRequests.forEach(r => excludeIds.push(r));
    if (me.friendRequests) me.friendRequests.forEach(r => excludeIds.push(r.from));

    console.log(`🎲 Finding random users for ${me.username}. Excluding ${excludeIds.length} users.`);

    const users = await User.aggregate([
      { 
        $match: { 
          _id: { $nin: excludeIds },
          $or: [
            { 'settings.privacy': { $exists: false } },
            { 'settings.privacy': { $ne: 'private' } }
          ],
          isActive: { $ne: false },
          isDeleted: { $ne: true }
        } 
      },
      { $sample: { size: 6 } },
      { $project: { name:1, username:1, avatar:1, avatarColor:1, bio:1, isOnline:1, kimichatId:1 } },
    ]);

    res.json({ success: true, users });
  } catch (err) {
    console.error('❌ GET /users/random error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

 
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

 
router.put('/update/profile', protect, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'music', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, bio, avatarColor, settings, status, statusMessage, musicTitle, musicArtist, backgroundType, backgroundPreset } = req.body;
    const update = {};
    if (name) update.name = name;
    if (bio) update.bio = bio;
    if (avatarColor) update.avatarColor = avatarColor;
    if (status) update.status = status;
    if (statusMessage) update.statusMessage = statusMessage;
    if (settings) update.settings = { ...req.user.settings, ...settings };
    if (typeof backgroundType !== 'undefined') update.backgroundType = backgroundType;
    if (typeof backgroundPreset !== 'undefined') update.backgroundPreset = backgroundPreset;

    if (req.files) {
      if (req.files.avatar && req.files.avatar[0]) {
        update.avatar = `uploads/${req.files.avatar[0].filename}`;
      }
      if (req.files.backgroundImage && req.files.backgroundImage[0]) {
        update.backgroundImage = `uploads/${req.files.backgroundImage[0].filename}`;
      }
      if (req.files.music && req.files.music[0]) {
        update.music = `uploads/${req.files.music[0].filename}`;
        update.musicTitle = musicTitle || req.files.music[0].originalname;
        update.musicArtist = musicArtist || 'Unknown Artist';
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json({ success: true, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
