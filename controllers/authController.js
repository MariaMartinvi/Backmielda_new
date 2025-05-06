const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        error: 'Validation error',
        details: 'Email and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ 
        error: 'User exists',
        details: 'A user with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Create new user
    const user = new User({
      email,
      password: hashedPassword
    });

    await user.save();
    console.log('User saved successfully:', email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('JWT token generated successfully');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        storiesGenerated: user.storiesGenerated,
        subscriptionStatus: user.subscriptionStatus,
        isPremium: user.subscriptionStatus === 'active'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        error: 'Validation error',
        details: 'Email and password are required'
      });
    }

    // Find user
    console.log('Searching for user:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        error: 'Authentication error',
        details: 'Invalid credentials'
      });
    }

    // Check password
    console.log('Checking password for user:', email);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ 
        error: 'Authentication error',
        details: 'Invalid credentials'
      });
    }

    // Generate JWT token
    console.log('Generating JWT token for user:', email);
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('Token generated successfully');
    console.log('User data to be sent:', {
      id: user._id,
      email: user.email,
      storiesGenerated: user.storiesGenerated,
      subscriptionStatus: user.subscriptionStatus
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        storiesGenerated: user.storiesGenerated,
        subscriptionStatus: user.subscriptionStatus,
        isPremium: user.subscriptionStatus === 'active'
      }
    });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
};

const logout = async (req, res) => {
  // Implementation of logout
};

const refreshToken = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        storiesGenerated: user.storiesGenerated,
        subscriptionStatus: user.subscriptionStatus,
        isPremium: user.subscriptionStatus === 'active'
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    console.log('Getting current user for ID:', req.user._id);
    
    // El usuario ya está disponible en req.user gracias al middleware
    const user = req.user;
    
    console.log('User found:', {
      id: user._id,
      email: user.email,
      storiesGenerated: user.storiesGenerated,
      subscriptionStatus: user.subscriptionStatus
    });

    res.json({
      id: user._id,
      email: user.email,
      storiesGenerated: user.storiesGenerated,
      subscriptionStatus: user.subscriptionStatus,
      isPremium: user.subscriptionStatus === 'active'
    });
  } catch (error) {
    console.error('Error getting current user:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
};

const loginWithGoogle = async (req, res) => {
  try {
    const { email, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: 'Email and Google ID are required'
      });
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        googleId,
        isVerified: true // Google accounts are pre-verified
      });
    } else if (!user.googleId) {
      // Link existing account with Google
      user.googleId = googleId;
      user.isVerified = true;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        storiesGenerated: user.storiesGenerated,
        subscriptionStatus: user.subscriptionStatus,
        isPremium: user.subscriptionStatus === 'active'
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  loginWithGoogle
}; 