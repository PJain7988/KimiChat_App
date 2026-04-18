// controllers/statusController.js
import Status from '../models/Status.js';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/status
 * Fetch all status updates from friends/contacts
 * Groups by user and sorts by newest first
 */
export const getStatuses = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get statuses from other users
    const statusGroups = await Status.aggregate([
      {
        $match: {
          userId: { $ne: userId }, // Don't include own statuses
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
      },
      {
        $group: {
          _id: '$userId',
          statuses: { $push: '$$ROOT' },
          user: { $first: '$user' },
          unseen: { $sum: { $cond: ['$seen', 0, 1] } },
        },
      },
      {
        $sort: { 'statuses.0.createdAt': -1 },
      },
      {
        $limit: 50, // Limit to 50 users for performance
      },
    ]);

    // Mark as seen
    await Status.updateMany(
      { userId: { $ne: userId }, seen: false },
      { $set: { seen: true, views: { $sum: ['$views', 1] } } }
    );

    return res.json({
      success: true,
      statusGroups,
      count: statusGroups.length,
    });
  } catch (err) {
    console.error('Error fetching statuses:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching statuses',
      error: err.message,
    });
  }
};

/**
 * GET /api/status/user/:userId
 * Get statuses from a specific user
 */
export const getUserStatuses = async (req, res) => {
  try {
    const { userId } = req.params;

    const statuses = await Status.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      statuses,
      count: statuses.length,
    });
  } catch (err) {
    console.error('Error fetching user statuses:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching statuses',
    });
  }
};

/**
 * POST /api/status
 * Create a new status
 * Accepts text, photo, video, or song
 */
export const createStatus = async (req, res) => {
  try {
    const { type, content, bg, filter } = req.body;
    const userId = req.user.id;

    // Validation
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Status type is required',
      });
    }

    if (type === 'text' && !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required for text status',
      });
    }

    if (['photo', 'video', 'song'].includes(type) && !req.files?.file) {
      return res.status(400).json({
        success: false,
        message: `File is required for ${type} status`,
      });
    }

    // Build status object
    const statusData = {
      userId,
      user: {
        id: req.user.id,
        name: req.user.name,
        avatar: req.user.avatar,
      },
      type,
      content: content?.trim() || '',
      bg: bg || 'linear-gradient(135deg,#00c9b1,#1a8cff)',
      filter: filter || 'none',
    };

    // Handle file upload
    if (req.files?.file) {
      const file = req.files.file[0];
      statusData.fileUrl = `/uploads/status/${file.filename}`;
      statusData.fileName = file.originalname;
      statusData.mimeType = file.mimetype;
      statusData.filePath = file.path; // For deletion later
    }

    // Handle song overlay
    if (req.files?.songFile) {
      const songFile = req.files.songFile[0];
      statusData.songUrl = `/uploads/status/${songFile.filename}`;
      statusData.songFileName = songFile.originalname;
      statusData.songPath = songFile.path; // For deletion later
    }

    // Save to database
    const status = new Status(statusData);
    await status.save();

    return res.status(201).json({
      success: true,
      message: 'Status posted successfully',
      status,
    });
  } catch (err) {
    console.error('Error creating status:', err);

    // Clean up uploaded files if error occurs
    if (req.files?.file) {
      fs.unlink(req.files.file[0].path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    }
    if (req.files?.songFile) {
      fs.unlink(req.files.songFile[0].path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting song:', unlinkErr);
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error posting status',
      error: err.message,
    });
  }
};

/**
 * DELETE /api/status/:statusId
 * Delete a status (only owner can delete)
 */
export const deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user.id;

    const status = await Status.findById(statusId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Status not found',
      });
    }

    // Check ownership
    if (status.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own status',
      });
    }

    // Delete files from disk
    if (status.filePath && fs.existsSync(status.filePath)) {
      fs.unlink(status.filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    if (status.songPath && fs.existsSync(status.songPath)) {
      fs.unlink(status.songPath, (err) => {
        if (err) console.error('Error deleting song:', err);
      });
    }

    // Delete from database
    await Status.findByIdAndDelete(statusId);

    return res.json({
      success: true,
      message: 'Status deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting status:', err);
    return res.status(500).json({
      success: false,
      message: 'Error deleting status',
    });
  }
};

/**
 * PUT /api/status/:statusId/reaction
 * Add or remove reaction to a status
 */
export const addReaction = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { reactionType } = req.body;

    const validReactions = ['heart', 'fire', 'laugh', 'clap'];

    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type',
      });
    }

    const status = await Status.findById(statusId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Status not found',
      });
    }

    // Increment reaction count
    status.reactions[reactionType] = (status.reactions[reactionType] || 0) + 1;
    await status.save();

    return res.json({
      success: true,
      message: 'Reaction added',
      reactions: status.reactions,
    });
  } catch (err) {
    console.error('Error adding reaction:', err);
    return res.status(500).json({
      success: false,
      message: 'Error adding reaction',
    });
  }
};

/**
 * POST /api/status/:statusId/reply
 * Add a reply to a status
 */
export const addReply = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply message cannot be empty',
      });
    }

    const status = await Status.findById(statusId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Status not found',
      });
    }

    const reply = {
      userId: req.user.id,
      userName: req.user.name,
      userAvatar: req.user.avatar,
      message: message.trim(),
      createdAt: new Date(),
    };

    status.replies.push(reply);
    await status.save();

    return res.status(201).json({
      success: true,
      message: 'Reply added',
      reply,
    });
  } catch (err) {
    console.error('Error adding reply:', err);
    return res.status(500).json({
      success: false,
      message: 'Error adding reply',
    });
  }
};

export default {
  getStatuses,
  getUserStatuses,
  createStatus,
  deleteStatus,
  addReaction,
  addReply,
};