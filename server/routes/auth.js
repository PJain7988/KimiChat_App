const express    = require('express');
const router     = express.Router();
const passport   = require('../config/passport');
const nodemailer = require('nodemailer');
const User       = require('../models/User');
const Chat       = require('../models/Chat');
const { generateToken, protect } = require('../middleware/auth');

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
});

const sendOTPEmail = async (to, otp) => {
  try {
    await mailer.sendMail({
      from:    `"KimiChat" <${process.env.EMAIL}>`,
      to,
      subject: 'Your KimiChat OTP Code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#050d1a;color:#e8f0fe;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(90deg,#00c9b1,#1a8cff);padding:24px;text-align:center;">
            <h2 style="margin:0;color:#fff;font-size:22px;">💬 KimiChat</h2>
          </div>
          <div style="padding:32px;text-align:center;">
            <p style="font-size:16px;color:#7a9cc0;margin-bottom:8px;">Your one-time verification code</p>
            <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#00c9b1;margin:20px 0;">${otp}</div>
            <p style="font-size:13px;color:#3d5a78;">Expires in <strong style="color:#e8f0fe;">10 minutes</strong>. Never share this code.</p>
          </div>
        </div>`,
    });
    console.log(`✅ OTP email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    throw err;
  }
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password || !username)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existing)
      return res.status(400).json({
        success: false,
        message: `${existing.email === email.toLowerCase() ? 'Email' : 'Username'} already registered`,
      });

    const user = await User.create({ name, email: email.toLowerCase(), password, username: username.toLowerCase() });
    await Chat.create({ name: 'Kimi AI', isAI: true, participants: [user._id], description: 'Your personal AI assistant' });

    res.status(201).json({ success: true, token: generateToken(user._id), user: user.toPublic() });
  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    user.isOnline = true;
    await user.save();

    res.json({ success: true, token: generateToken(user._id), user: user.toPublic() });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    const { phone, email } = req.body;
    const identifier = email || phone;

    if (!identifier)
      return res.status(400).json({ success: false, message: 'Phone or email required' });

    const otp       = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let user = email
      ? await User.findOne({ email: email.toLowerCase() })
      : await User.findOne({ phone });

    if (!user) {
      const base     = identifier.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 12);
      const username = `${base}_${Date.now().toString(36).slice(-4)}`;
      user = await User.create({
        name:     'KimiChat User',
        username,
        email:    email ? email.toLowerCase() : `${phone}@phone.kimichat.app`,
        phone:    phone || '',
        password: `otp_${Date.now()}`,
      });
    }

    user.otp       = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    if (email) {
      await sendOTPEmail(email.toLowerCase(), otp);
      return res.json({ success: true, message: `OTP sent to ${email}` });
    }

    console.log(`\n📱 OTP for ${phone}: ${otp}\n`);
    res.json({
      success: true,
      message: 'OTP sent to phone',
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp }),
    });
  } catch (err) {
    console.error('[send-otp]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, email, otp } = req.body;

    if (!otp) return res.status(400).json({ success: false, message: 'OTP required' });

    const query = email ? { email: email.toLowerCase() } : { phone };
    const user  = await User.findOne(query).select('+otp +otpExpiry');

    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date())
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    user.otp       = undefined;
    user.otpExpiry = undefined;
    user.isOnline  = true;
    await user.save();

    res.json({ success: true, token: generateToken(user._id), user: user.toPublic() });
  } catch (err) {
    console.error('[verify-otp]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/google/redirect',
  passport.authenticate('google', {
    scope:  ['profile', 'email'],
    session: false,
  })
);

router.get('/google/callback',
  passport.authenticate('google', {
    session:         false,
    failureRedirect: `${process.env.CLIENT_URL}/auth?error=google_failed`,
  }),
  (req, res) => {
    const token = generateToken(req.user._id);
    console.log(`✅ Google OAuth success: ${req.user.email}`);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

router.get('/github/redirect',
  passport.authenticate('github', {
    scope:   ['user:email', 'read:user'],
    session: false,
  })
);

router.get('/github/callback',
  passport.authenticate('github', {
    session:         false,
    failureRedirect: `${process.env.CLIENT_URL}/auth?error=github_failed`,
  }),
  (req, res) => {
    const token = generateToken(req.user._id);
    console.log(`✅ GitHub OAuth success: ${req.user.email}`);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

router.get('/discord/redirect',
  passport.authenticate('discord', { session: false })
);

router.get('/discord/callback',
  passport.authenticate('discord', {
    session:         false,
    failureRedirect: `${process.env.CLIENT_URL}/auth?error=discord_failed`,
  }),
  (req, res) => {
    const token = generateToken(req.user._id);
    console.log(`✅ Discord OAuth success: ${req.user.email}`);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

router.post('/social', async (req, res) => {
  try {
    const { provider, providerId, name, email, avatar } = req.body;

    if (!provider || !providerId)
      return res.status(400).json({ success: false, message: 'provider and providerId are required' });

    const idField = `${provider}Id`;
    let user = await User.findOne({ [idField]: providerId });

    if (!user && email) user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      user[idField] = providerId;
      if (avatar && !user.avatar) user.avatar = avatar;
      user.isOnline = true;
      await user.save();
    } else {
      const base     = (name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 14);
      const username = `${base}_${Date.now().toString(36).slice(-4)}`;
      user = await User.create({
        name:       name || `${provider} User`,
        email:      email ? email.toLowerCase() : `${providerId}@${provider}.kimichat.app`,
        username,
        avatar:     avatar || '',
        [idField]:  providerId,
        isOnline:   true,
      });
      await Chat.create({ name: 'Kimi AI', isAI: true, participants: [user._id] });
    }

    res.json({ success: true, token: generateToken(user._id), user: user.toPublic() });
  } catch (err) {
    console.error('[social]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user.toPublic() });
});

router.post('/logout', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('[logout]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;