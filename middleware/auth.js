const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Checking authorization header');
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader);

    if (!authHeader) {
      console.log('No authorization header found');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No authorization header provided' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', token.substring(0, 10) + '...');

    if (!token) {
      console.log('No token found in authorization header');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided' 
      });
    }

    console.log('Verifying token with JWT_SECRET');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully, user ID:', decoded.id);

    const user = await User.findById(decoded.id);
    console.log('User found:', user ? user.email : 'No user found');

    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'User not found' 
      });
    }

    // Check if user's email is verified
    if (!user.isVerified) {
      console.log('User email not verified:', user.email);
      return res.status(401).json({ 
        error: 'Email not verified',
        message: 'Please verify your email address to access this resource' 
      });
    }

    req.user = user;
    req.token = token;
    console.log('Authentication successful for user:', user.email);
    next();
  } catch (error) {
    console.error('Auth middleware error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again' 
      });
    }
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Authentication verification failed' 
    });
  }
};

// Optional auth middleware (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (user && user.isVerified) {
      req.user = user;
      req.token = token;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    req.user = null;
    next();
  }
};

module.exports = { auth, optionalAuth }; 