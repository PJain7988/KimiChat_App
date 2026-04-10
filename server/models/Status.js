const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, enum: ['text','image','video'], default: 'text' },
  content:  { type: String, default: '' },
  mediaUrl: { type: String, default: '' },
  bg:       { type: String, default: 'linear-gradient(135deg,#00c9b1,#1a8cff)' },
  emoji:    { type: String, default: '' },
  viewers:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt:{ type: Date, default: () => new Date(Date.now() + 24*60*60*1000) },
}, { timestamps: true });

// Auto-expire
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Status', statusSchema);
