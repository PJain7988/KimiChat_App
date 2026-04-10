const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Chat = require('../models/Chat');
const { generateToken } = require('../middleware/auth');

// ── Register ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password || !username) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email or username already taken' });
    }

    const user = await User.create({ name, email, password, username });

    // Create AI Chat for new user
    await Chat.create({
      name: 'Kimi AI',
      isAI: true,
      participants: [user._id],
      description: 'Your personal AI assistant',
    });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Login with Email ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Send OTP ─────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // In production: integrate Twilio/MSG91
    console.log(`📱 OTP for ${phone}: ${otp}`);

    let user = await User.findOne({ phone });
    if (!user) {
      // Pre-register with phone
      user = await User.create({
        name: 'KimiChat User',
        username: 'user_' + Date.now(),
        email: phone + '@phone.kimichat.app',
        password: otp + '_temp',
        phone,
      });
    }

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    res.json({ success: true, message: 'OTP sent (check console in dev)', dev_otp: otp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Verify OTP ───────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone }).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Social Auth (Google/Discord/GitHub) ──────────────────
router.post('/social', async (req, res) => {
  try {
    const { provider, providerId, name, email, avatar } = req.body;

    let query = {};
    if (provider === 'google')  query.googleId = providerId;
    if (provider === 'discord') query.discordId = providerId;
    if (provider === 'github')  query.githubId = providerId;

    let user = await User.findOne(query);

    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      const username = (name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36)).slice(0, 20);
      user = await User.create({
        name,
        email: email || `${providerId}@${provider}.kimichat.app`,
        username,
        password: providerId + process.env.JWT_SECRET,
        avatar,
        [`${provider}Id`]: providerId,
      });
      await Chat.create({ name: 'Kimi AI', isAI: true, participants: [user._id] });
    } else {
      user[`${provider}Id`] = providerId;
      if (avatar && !user.avatar) user.avatar = avatar;
    }

    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get Me ───────────────────────────────────────────────
const { protect } = require('../middleware/auth');

router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user.toPublic() });
});

// ── Logout ───────────────────────────────────────────────
router.post('/logout', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
