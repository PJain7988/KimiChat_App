// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ════════════════════════════════════════════════════════
// CREATE UPLOADS DIRECTORY
// ════════════════════════════════════════════════════════
const uploadsDir = path.join(__dirname, '../uploads');

// Create directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// ════════════════════════════════════════════════════════
// STORAGE CONFIGURATION
// ════════════════════════════════════════════════════════
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// ════════════════════════════════════════════════════════
// FILE FILTER - ALLOW ONLY CERTAIN TYPES
// ════════════════════════════════════════════════════════
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimes = {
    // Images
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,

    // Videos
    'video/mp4': true,
    'video/webm': true,
    'video/quicktime': true,
    'video/x-msvideo': true,
    'video/mpeg': true,

    // Audio
    'audio/mpeg': true,
    'audio/mp3': true,
    'audio/wav': true,
    'audio/ogg': true,
    'audio/mp4': true,
    'audio/aac': true,
    'audio/flac': true,
  };

  if (allowedMimes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`));
  }
};

// ════════════════════════════════════════════════════════
// CREATE MULTER INSTANCE
// ════════════════════════════════════════════════════════
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

module.exports = upload;