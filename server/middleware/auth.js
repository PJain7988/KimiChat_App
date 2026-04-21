 
const jwt = require('jsonwebtoken');
const User = require('../models/User');

 
const protect = async (req, res, next) => {
  try {
    let token;

     
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

     
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

     
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

     
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

     
    req.user = await User.findById(decoded.id).select(
      '-password -otp -otpExpiry -__v'
    );

     
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
      });
    }

     
    if (req.user.isDeleted === true || req.user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or has been deleted',
      });
    }

     
    next();
  } catch (err) {
    console.error('❌ Auth error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

 
const optionalAuth = async (req, res, next) => {
  try {
    let token;

     
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

     
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select(
          '-password -otp -otpExpiry -__v'
        );

         
        if (req.user) {
          req.isAuthenticated = true;
        }
      } catch (err) {
         
        console.warn('⚠️  Optional auth token invalid:', err.message);
        req.isAuthenticated = false;
      }
    } else {
      req.isAuthenticated = false;
    }

     
    next();
  } catch (err) {
    console.error('❌ Optional auth error:', err.message);
     
    req.isAuthenticated = false;
    next();
  }
};

 
const isOwner = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    try {
       
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to perform this action',
        });
      }

       
      const resourceUserId =
        req.params[resourceUserIdField] ||  
        req.body[resourceUserIdField] ||  
        req.body.user ||  
        req.params.userId ||  
        req.body.userId;  

       
      if (!resourceUserId) {
        console.warn('⚠️  Resource user ID not found in request');
         
        return next();
      }

       
      const currentUserId = req.user._id.toString();
      const resourceOwnerIdStr = resourceUserId.toString();

      if (currentUserId !== resourceOwnerIdStr) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden - You do not have permission to perform this action',
        });
      }

       
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

 
const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

     
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