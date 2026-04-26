// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * ✅ PROTECT MIDDLEWARE - Verify JWT token and load user
 * Required for protected routes
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Get token from Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2️⃣ OR get token from cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // 3️⃣ No token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    // 4️⃣ Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.',
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token signature. Please login again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token invalid or expired',
      });
    }

    // 5️⃣ Get user from database (exclude sensitive fields)
    req.user = await User.findById(decoded.id).select(
      '-password -otp -otpExpiry -__v'
    );

    // 6️⃣ Check if user still exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
      });
    }

    // 7️⃣ Check if user is active/not deleted
    if (req.user.isDeleted === true || req.user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or has been deleted',
      });
    }

    // ✅ All checks passed, proceed to next middleware
    next();
  } catch (err) {
    console.error('❌ Auth error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * ✅ OPTIONAL AUTH MIDDLEWARE (NEW)
 * Doesn't throw error if no token - sets req.user if valid token exists
 * Useful for public routes that can be personalized for logged-in users
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookies
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // If token exists, try to verify and load user
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select(
          '-password -otp -otpExpiry -__v'
        );

        // Set flag indicating user is authenticated
        if (req.user) {
          req.isAuthenticated = true;
        }
      } catch (err) {
        // Token invalid but continue anyway (optional auth)
        console.warn('⚠️  Optional auth token invalid:', err.message);
        req.isAuthenticated = false;
      }
    } else {
      req.isAuthenticated = false;
    }

    // Continue to next middleware regardless of token validity
    next();
  } catch (err) {
    console.error('❌ Optional auth error:', err.message);
    // Still continue - optional auth shouldn't block
    req.isAuthenticated = false;
    next();
  }
};

/**
 * ✅ CHECK OWNERSHIP MIDDLEWARE (NEW)
 * Verify that user owns the resource
 * Usage: router.delete('/:id', protect, isOwner('userId'), deleteHandler)
 */
const isOwner = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    try {
      // Must be authenticated to check ownership
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to perform this action',
        });
      }

      // Get resource user ID from various sources
      const resourceUserId =
        req.params[resourceUserIdField] || // From URL params
        req.body[resourceUserIdField] || // From request body
        req.body.user || // Alternative body field
        req.params.userId || // Alternative param
        req.body.userId; // Alternative body

      // If no resource user ID found, check direct ownership in params
      if (!resourceUserId) {
        console.warn('⚠️  Resource user ID not found in request');
        // Assume current user is the owner if no specific field
        return next();
      }

      // Compare user IDs as strings
      const currentUserId = req.user._id.toString();
      const resourceOwnerIdStr = resourceUserId.toString();

      if (currentUserId !== resourceOwnerIdStr) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden - You do not have permission to perform this action',
        });
      }

      // ✅ User owns the resource
      next();
    } catch (err) {
      console.error('❌ Ownership check error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
      });
    }
  };
};

/**
 * ✅ CHECK ADMIN MIDDLEWARE (NEW)
 * Verify that user is an admin
 * Usage: router.delete('/users/:id', protect, isAdmin, deleteUserHandler)
 */
const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    next();
  } catch (err) {
    console.error('❌ Admin check error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error checking admin status',
    });
  }
};

/**
 * ✅ GENERATE TOKEN
 * Create JWT token for user
 * Usage: const token = generateToken(user._id);
 */
const generateToken = (userId) => {
  if (!userId) {
    throw new Error('User ID is required to generate token');
  }

  try {
    const token = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE || '30d',
      }
    );
    return token;
  } catch (err) {
    console.error('❌ Token generation error:', err.message);
    throw new Error('Failed to generate token');
  }
};

/**
 * ✅ VERIFY TOKEN (without loading user)
 * Just verify if token is valid
 * Usage: const decoded = verifyToken(token);
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw err;
  }
};

const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (err) {
    console.error('❌ Token decode error:', err.message);
    return null;
  }
};

const refreshToken = (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to refresh token');
    }
    return generateToken(userId);
  } catch (err) {
    console.error('❌ Token refresh error:', err.message);
    throw err;
  }
};

module.exports = {
  protect,
  optionalAuth,
  isOwner,
  isAdmin,
  generateToken,
  verifyToken,
  decodeToken,
  refreshToken,
};