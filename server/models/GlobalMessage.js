const mongoose = require('mongoose');

const globalMessageSchema = new mongoose.Schema({
  room:    { type: String, required: true, default: 'general' },
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type:    { type: String, enum: ['text','image','poll','file'], default: 'text' },
  reactions:[{
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String,
  }],
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('GlobalMessage', globalMessageSchema);
