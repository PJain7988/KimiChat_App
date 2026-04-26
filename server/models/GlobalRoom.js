const mongoose = require('mongoose');

const globalRoomSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  emoji: { type: String, default: '🌐' },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' }, // Lounge, Tech, Gaming, Music, etc.
  type: { type: String, enum: ['public', 'private'], default: 'public' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  membersCount: { type: Number, default: 0 },
  slowMode: { type: Number, default: 0 }, // seconds
  isNSFW: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('GlobalRoom', globalRoomSchema);
