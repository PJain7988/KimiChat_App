const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat:    { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  type:    { type: String, enum: ['text','image','audio','video','file','emoji','ai'], default: 'text' },
  fileUrl: { type: String, default: '' },
  fileName:{ type: String, default: '' },
  isAI:    { type: Boolean, default: false },

  readBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String,
  }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
