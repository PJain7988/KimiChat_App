const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:        { type: String, default: 'KimiChat User', trim: true },
  username:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  phone:       { type: String, default: '' },

  // password is NOT required — OAuth users don't have one
  password:    { type: String, select: false },

  avatar:      { type: String, default: '' },
  avatarColor: { type: String, default: '#00c9b1' },
  bio:         { type: String, default: 'Hey there! I am using KimiChat 👋', maxlength: 150 },
  kimichatId:  { type: String, unique: true },

  // Online status
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date,    default: Date.now },
  socketId: { type: String,  default: '' },

  // Account status
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

  // Social graph
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{
    from:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now },
  }],
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  communities:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],

  // Settings
  settings: {
    theme:         { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true },
    privacy:       { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
    readReceipts:  { type: Boolean, default: true },
    autoSuggestions: { type: Boolean, default: true },
    voiceProcessing: { type: Boolean, default: true },
    readContext:     { type: Boolean, default: false },
    showPreviews:    { type: Boolean, default: true },
    reactionNotifs:  { type: Boolean, default: true },
    lastSeen:        { type: String, default: 'Everyone' },
    profilePhoto:    { type: String, default: 'Everyone' },
    about:           { type: String, default: 'Everyone' },
    notificationSound: { type: String, default: 'Tri-tone' },
    accentColor:     { type: String, default: '#00c9b1' },
    glassmorphism:   { type: Boolean, default: true },
    bubbleStyle:     { type: String, default: 'modern' },
    fontScale:       { type: String, default: '100%' },
    autoDownload: {
      photos: { type: Boolean, default: true },
      videos: { type: Boolean, default: false },
      audio:  { type: Boolean, default: true },
    },
    dataSaver: { type: Boolean, default: false },
  },

  // Security & Sessions
  sessions: [{
    deviceName: { type: String },
    location:   { type: String },
    ip:         { type: String },
    lastActive: { type: Date, default: Date.now },
  }],

  // OAuth IDs — any one of these being present means an OAuth user
  googleId:  { type: String, default: null },
  discordId: { type: String, default: null },
  githubId:  { type: String, default: null },

  // OTP
  otp:       { type: String, select: false },
  otpExpiry: { type: Date,   select: false },

}, { timestamps: true });

/* ── Auto-generate KimiChat ID + hash password on save ── */
userSchema.pre('save', async function (next) {
  // Generate unique KimiChat ID for new users
  if (this.isNew) {
    this.kimichatId = 'KC' + Date.now().toString(36).toUpperCase();
  }

  // Only hash password if it was set and modified
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  next();
});

/* ── Compare plaintext password with hash ── */
userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

/* ── Strip sensitive fields before sending to client ── */
userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.socketId;
  return obj;
};

/* ── Virtual: check if user signed up via OAuth ── */
userSchema.virtual('isOAuthUser').get(function () {
  return !!(this.googleId || this.discordId || this.githubId);
});

module.exports = mongoose.model('User', userSchema);