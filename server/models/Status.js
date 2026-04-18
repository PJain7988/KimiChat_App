const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Keep this for legacy or quick display if needed, but primary is userId
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
    // Consolidated file fields
    fileUrl: String,
    fileName: String,
    songUrl: String,
    songFileName: String,

    // Improved tracking
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String }, // 'heart', 'fire', 'laugh', 'clap'
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
      expires: 86400, // 24 hour TTL
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Status', statusSchema);