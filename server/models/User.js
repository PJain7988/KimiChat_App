const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  username:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  phone:       { type: String, default: '' },
  password:    { type: String, required: true, select: false },
  avatar:      { type: String, default: '' },
  avatarColor: { type: String, default: '#00c9b1' },
  bio:         { type: String, default: 'Hey there! I am using KimiChat 👋', maxlength: 150 },
  kimichatId:  { type: String, unique: true },

  // Online status
  isOnline:    { type: Boolean, default: false },
  lastSeen:    { type: Date, default: Date.now },
  socketId:    { type: String, default: '' },

  // Social
  friends:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{
    from:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now }
  }],
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  communities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],

  // Settings
  settings: {
    theme:         { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true },
    privacy:       { type: String, enum: ['public','friends','private'], default: 'public' },
  },

  // Auth
  googleId:  { type: String },
  discordId: { type: String },
  githubId:  { type: String },
  otp:       { type: String },
  otpExpiry: { type: Date },

}, { timestamps: true });

// Auto-generate KimiChat ID
userSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.kimichatId = 'KC' + Date.now().toString(36).toUpperCase();
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
