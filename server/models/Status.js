const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    user: {
      id: String,
      name: String,
      avatar: String,
    },
    type: {
      type: String,
      enum: ['text', 'photo', 'video', 'song'],
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    bg: {
      type: String,
      default: 'linear-gradient(135deg,#00c9b1,#1a8cff)',
    },
    filter: {
      type: String,
      default: 'none',
    },
    fileUrl: String,
    fileName: String,
    songUrl: String,
    songFileName: String,

    views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String }, 
      },
    ],
    replies: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 86400, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Status', statusSchema);