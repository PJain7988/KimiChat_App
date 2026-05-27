const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

 
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

 
router.post('/', protect, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, emoji, category, privacy, tags } = req.body;

    let avatarUrl = '';
    let bannerUrl = '';
    if (req.files) {
      if (req.files.avatar) {
        avatarUrl = `uploads/${req.files.avatar[0].filename}`;
      }
      if (req.files.banner) {
        bannerUrl = `uploads/${req.files.banner[0].filename}`;
      }
    }

    const chat = await Chat.create({
      name: `${name} Community`,
      isGroup: true,
      participants: [req.user._id],
      admins: [req.user._id],
    });

    const community = await Community.create({
      name, description, emoji, category, privacy, tags,
      avatar: avatarUrl,
      banner: bannerUrl,
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

 
router.post('/:id/add-member', protect, async (req, res) => {
  try {
    const { username } = req.body;
    const community = await Community.findById(req.params.id);
    if (!community.admins.includes(req.user._id) && community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const User = require('../models/User');
    const userToAdd = await User.findOne({ username });
    if (!userToAdd) return res.status(404).json({ success: false, message: 'User not found' });

    if (community.members.includes(userToAdd._id)) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    community.members.push(userToAdd._id);
    community.memberCount = community.members.length;
    await community.save();

    if (community.chat) {
      await Chat.findByIdAndUpdate(community.chat, { $addToSet: { participants: userToAdd._id } });
    }

    res.json({ success: true, message: 'User added' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

 
router.get('/:id', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('creator', 'name username avatar')
      .populate('members', 'name username avatar isOnline')
      .populate('rooms', 'name lastMessage participants');
    if (!community) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, community });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

 
router.post('/:id/kick/:userId', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, message: 'Not found' });

     
    if (!community.admins.includes(req.user._id) && community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    community.members = community.members.filter(m => m.toString() !== req.params.userId);
    community.memberCount = community.members.length;
    await community.save();

     
    await Chat.findByIdAndUpdate(community.chat, { $pull: { participants: req.params.userId } });
    if (community.rooms?.length) {
      await Chat.updateMany({ _id: { $in: community.rooms } }, { $pull: { participants: req.params.userId } });
    }

    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

 
router.post('/:id/rooms', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, message: 'Not found' });

    if (!community.admins.includes(req.user._id) && community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { name } = req.body;
    const room = await Chat.create({
      name,
      isGroup: true,
      participants: community.members,  
      admins: [req.user._id],
    });

    community.rooms.push(room._id);
    await community.save();

    res.status(201).json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

 
router.patch('/:id/rules', protect, async (req, res) => {
  try {
    const { rules } = req.body;
    const community = await Community.findById(req.params.id);
    if (!community.admins.includes(req.user._id) && community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    community.rules = rules;
    await community.save();
    res.json({ success: true, community });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
