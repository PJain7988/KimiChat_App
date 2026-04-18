const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  avatar:      { type: String, default: '' },
  emoji:       { type: String, default: '🏘️' },
  banner:      { type: String, default: '' },
  category:    { type: String, enum: ['Technology','Gaming','Art & Design','Music','Sports','Education','Business','Other'], default: 'Other' },
  privacy:     { type: String, enum: ['public','private','invite'], default: 'public' },

  creator:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  chat:     { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }, // Primary general chat
  rooms:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }], // Sub-groups/rooms

  tags:     [String],
  verified: { type: Boolean, default: false },
  rules:    [String],

  memberCount: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Community', communitySchema);
