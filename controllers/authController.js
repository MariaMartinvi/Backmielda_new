const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library'); // Import Google Auth Library

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Make sure this is set in your backend .env
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

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
    const { idToken } = req.body; // Expect idToken from frontend

    if (!idToken) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: 'ID token is required'
      });
    }

    // Verify the ID token with Google
    let ticket;
    try {
      ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: GOOGLE_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      });
    } catch (verifyError) {
      console.error('Google ID token verification error:', verifyError);
      return res.status(401).json({
        error: 'Authentication error',
        details: 'Invalid Google ID token'
      });
    }

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const emailVerified = payload['email_verified'];
    // const name = payload['name']; // Optional: if you want to store name

    if (!emailVerified) {
      return res.status(401).json({
        error: 'Authentication error',
        details: 'Google email not verified'
      });
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        googleId, // Store Google ID
        isVerified: true, // Email is verified by Google
        // name: name, // Optionally store name
        // You might not have a password, or set a strong random one if your model requires it
        // or adjust your User model to allow no local password for Google users
      });
      await user.save();
      console.log('New user created via Google:', email);
    } else {
      // User exists, ensure Google ID is linked if they previously signed up with email/password
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true; // Mark as verified if logging in with Google
        await user.save();
        console.log('Existing user linked with Google:', email);
      }
      // Security check: if the existing user's googleId doesn't match, it's an issue.
      else if (user.googleId !== googleId) {
        console.error('Google ID mismatch for user:', email);
        return res.status(403).json({
          error: 'Authentication error',
          details: 'Google account mismatch.'
        });
      }
      console.log('User found via Google:', email);
    }

    // Generate JWT token for your application
    const appToken = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        isPremium: user.isPremium, // Ensure these fields are populated correctly
        subscriptionStatus: user.subscriptionStatus
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(200).json({
      token: appToken,
      user: {
        id: user._id,
        email: user.email,
        storiesGenerated: user.storiesGenerated,
        subscriptionStatus: user.subscriptionStatus,
        isPremium: user.isPremium || (user.subscriptionStatus === 'active')
        // name: user.name // Send name if stored
      }
    });

  } catch (error) {
    console.error('Google login controller error:', error);
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