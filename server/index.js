// ═══════════════════════════════════════════════════════
// ⚠️  CRITICAL: Load .env FIRST before anything else!
// ═══════════════════════════════════════════════════════
require('dotenv').config();

// ═══════════════════════════════════════════════════════
// DEPENDENCIES
// ═══════════════════════════════════════════════════════
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const fs = require('fs');

// ✅ NOW .env is loaded, safe to require passport
const passport = require('./config/passport');

// ═══════════════════════════════════════════════════════
// ENVIRONMENT VALIDATION
// ═══════════════════════════════════════════════════════
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'MONGO_URI',
  'JWT_SECRET',
  'CLIENT_URL',
];

// Optional OAuth vars - only required if OAuth is enabled
const optionalEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please check your .env file');
  process.exit(1);
}

// Check optional vars
const missingOptionalVars = optionalEnvVars.filter(varName => !process.env[varName]);
if (missingOptionalVars.length > 0) {
  console.warn(`⚠️  Missing optional environment variables: ${missingOptionalVars.join(', ')}`);
  console.warn('OAuth features may be disabled');
}

// ═══════════════════════════════════════════════════════
// EXPRESS & SERVER SETUP
// ═══════════════════════════════════════════════════════
const app = express();
const server = http.createServer(app);
// Share io with routes
app.set('io', null); 

const CLIENT_URL = process.env.CLIENT_URL || 'https://kimi-chat-app.vercel.app/';
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ═══════════════════════════════════════════════════════
// SOCKET.IO CONFIGURATION
// ═══════════════════════════════════════════════════════
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

app.set('io', io);

// ═══════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════

// Helmet for security headers
app.use(
  helmet({
    // Allow OAuth popups (Google/Discord/GitHub)
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin images/media
    contentSecurityPolicy: false,
  })
);

// ✅ FIXED: Proper rate limiting with IPv6 support
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Don't rate-limit OAuth callbacks and health checks
    return (
      req.path.includes('/callback') ||
      req.path.includes('/health')
    );
  },
  requestWasSuccessful: (req, res) => res.statusCode < 400,
});

app.use('/api/', limiter);

// ═══════════════════════════════════════════════════════
// CORS MIDDLEWARE
// ═══════════════════════════════════════════════════════
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ═══════════════════════════════════════════════════════
// BODY PARSER & STATIC FILES
// ═══════════════════════════════════════════════════════
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// ═══════════════════════════════════════════════════════
// SESSION MIDDLEWARE (Required for Passport OAuth)
// ═══════════════════════════════════════════════════════
app.use(
  session({
    secret: process.env.JWT_SECRET || 'kimichat_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  })
);

// ═══════════════════════════════════════════════════════
// PASSPORT MIDDLEWARE (Must come AFTER session)
// ═══════════════════════════════════════════════════════
app.use(passport.initialize());
app.use(passport.session());

// ═══════════════════════════════════════════════════════
// REQUEST LOGGING
// ═══════════════════════════════════════════════════════
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor =
      res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '⚠️' : '✅';
    console.log(
      `${statusColor} ${req.method.padEnd(6)} ${req.path.padEnd(40)} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// ═══════════════════════════════════════════════════════
// DATABASE CONNECTION
// ═══════════════════════════════════════════════════════
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not defined in .env');
    }

    // ✅ FIXED: Removed deprecated useNewUrlParser and useUnifiedTopology options
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB Connected');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⏳ Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// MongoDB event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB Disconnected — Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Error:', err.message);
});

// Connect to database
connectDB();

// ═══════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'KimiChat API running 🚀',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    passport: 'ready',
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/community', require('./routes/community'));

// ✅ STATUS ROUTES - Properly integrated with authentication
app.use('/api/status', require('./routes/status'));

app.use('/api/global', require('./routes/global'));

// ═══════════════════════════════════════════════════════
// 404 - NOT FOUND
// ═══════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ═══════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    method: req.method,
    path: req.path,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        message: 'File is too large. Maximum size is 100MB',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded',
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Handle validation errors
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ═══════════════════════════════════════════════════════
// SOCKET.IO EVENT HANDLER
// ═══════════════════════════════════════════════════════
try {
  require('./socket/socketHandler')(io);
  console.log('✅ Socket.IO handler loaded');
} catch (err) {
  console.error('⚠️  Socket.IO Handler Error:', err.message);
  console.log('   Continuing without Socket.IO features...');
}

// ═══════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════
const serverInstance = server.listen(PORT, () => {
  console.log('\n' + '═'.repeat(65));
  console.log('🚀 KimiChat Server Started Successfully');
  console.log('═'.repeat(65));
  console.log(`📡 Port:          ${PORT}`);
  console.log(`🌐 Environment:   ${NODE_ENV}`);
  console.log(`🔗 Client URL:    ${CLIENT_URL}`);
  console.log(`⚡ Socket.IO:     Ready (WebSocket + Polling)`);
  console.log(`🔐 Passport:      Google | GitHub | Discord`);
  console.log(`📸 Status API:    Ready (Photos, Videos, Songs)`);
  console.log(
    `💾 MongoDB:       ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Connecting...'}`
  );
  console.log('═'.repeat(65) + '\n');
});

// ═══════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════
const shutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received — Shutting down gracefully...`);

  serverInstance.close(async () => {
    console.log('🔌 HTTP Server closed');

    try {
      await mongoose.connection.close();
      console.log('💾 MongoDB disconnected');
    } catch (err) {
      console.error('❌ Error closing MongoDB:', err.message);
    }

    console.log('✅ Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown — graceful shutdown took too long');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ═══════════════════════════════════════════════════════
// UNHANDLED ERRORS
// ═══════════════════════════════════════════════════════
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', {
    reason,
    promise: promise.toString(),
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

module.exports = { app, io, server };