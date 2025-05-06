const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Checking authorization header');
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader);

    if (!authHeader) {
      console.log('No authorization header found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', token.substring(0, 10) + '...');

    if (!token) {
      console.log('No token found in authorization header');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Verifying token with JWT_SECRET');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully, user ID:', decoded.id);

    const user = await User.findById(decoded.id);
    console.log('User found:', user ? user.email : 'No user found');

    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'User not found' });
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
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = auth; 