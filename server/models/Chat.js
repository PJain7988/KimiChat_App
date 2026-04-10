const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name:        { type: String, default: '' },
  isGroup:     { type: Boolean, default: false },
  isAI:        { type: Boolean, default: false },
  avatar:      { type: String, default: '' },
  description: { type: String, default: '' },

  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },

  pinnedFor:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mutedBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
