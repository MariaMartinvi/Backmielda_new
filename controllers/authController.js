const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library'); // Import Google Auth Library
const emailService = require('../services/emailService');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Make sure this is set in your backend .env
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Generate secure random token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Email validation regex
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
const isValidPassword = (password) => {
  // At least 6 characters
  return password.length >= 6;
};

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

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ 
        error: 'User exists',
        details: 'A user with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    // Generate email verification token
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user (not verified initially)
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    await user.save();
    console.log('User saved successfully:', email);

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken);
      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Still return success since user was created
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: 'Internal server error during registration'
    });
  }
};

// Email verification endpoint
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Verification token is required'
      });
    }

    // First, check if there's a user with this token that's already verified
    const alreadyVerifiedUser = await User.findOne({
      emailVerificationToken: token,
      isVerified: true
    });

    if (alreadyVerifiedUser) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified! You can log in.',
        data: {
          email: alreadyVerifiedUser.email,
          isVerified: alreadyVerifiedUser.isVerified
        }
      });
    }

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      // Check if there's a user with this token but expired
      const expiredUser = await User.findOne({
        emailVerificationToken: token
      });
      
      if (expiredUser) {
        return res.status(400).json({
          error: 'Token expired',
          details: 'Email verification token has expired. Please request a new verification email.'
        });
      }
      
      return res.status(400).json({
        error: 'Invalid token',
        details: 'Email verification token is invalid or has expired'
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('Email verified successfully for user:', user.email);

    // Generate JWT token for auto-login
    const authToken = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You are now logged in.',
      token: authToken, // Include token for auto-login
      data: {
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        storiesGenerated: user.storiesGenerated,
        monthlyStoriesGenerated: user.monthlyStoriesGenerated,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Internal server error during email verification'
    });
  }
};

// Resend verification email
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'No user found with this email address'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        error: 'Already verified',
        details: 'This email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Error sending verification email'
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
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        error: 'Authentication error',
        details: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      console.log('Email not verified for user:', email);
      return res.status(401).json({
        error: 'Email not verified',
        details: 'Please verify your email address before logging in'
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
        subscriptionStatus: user.subscriptionStatus,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
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

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        storiesGenerated: user.storiesGenerated,
        monthlyStoriesGenerated: user.monthlyStoriesGenerated,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: 'Internal server error during login'
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account with that email exists, you will receive a password reset email'
    };

    if (!user) {
      console.log('Password reset requested for non-existent email:', email);
      return res.status(200).json(successResponse);
    }

    if (!user.isVerified) {
      console.log('Password reset requested for unverified email:', email);
      return res.status(200).json(successResponse);
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
      console.log('Password reset email sent to:', email);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
    }

    res.status(200).json(successResponse);

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Error processing password reset request'
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Token and new password are required'
      });
    }

    // Validate new password strength
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Password must be at least 6 characters long'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid token',
        details: 'Password reset token is invalid or has expired'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log('Password reset successfully for user:', user.email);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Error resetting password'
    });
  }
};

const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Error during logout'
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const user = req.user;
    
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        storiesGenerated: user.storiesGenerated,
        monthlyStoriesGenerated: user.monthlyStoriesGenerated,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Error refreshing token'
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    // Check and reset monthly count if needed
    user.checkAndResetMonthlyCount();
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        storiesGenerated: user.storiesGenerated,
        monthlyStoriesGenerated: user.monthlyStoriesGenerated,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Error getting user information'
    });
  }
};

const loginWithGoogle = async (req, res) => {
  try {
    const { idToken } = req.body;

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
          audience: GOOGLE_CLIENT_ID,
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

    if (!emailVerified) {
      return res.status(401).json({
        error: 'Authentication error',
        details: 'Google email not verified'
      });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        email: email.toLowerCase(),
        googleId,
        isVerified: true, // Email is verified by Google
      });
      await user.save();
      console.log('New user created via Google:', email);
      
      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(email);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }
    } else {
      // User exists, ensure Google ID is linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;
        await user.save();
        console.log('Existing user linked with Google:', email);
      } else if (user.googleId !== googleId) {
        console.error('Google ID mismatch for user:', email);
        return res.status(403).json({
          error: 'Authentication error',
          details: 'Google account mismatch.'
        });
      }
      console.log('User found via Google:', email);
    }

    // Generate JWT token
    const appToken = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      token: appToken,
      data: {
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        storiesGenerated: user.storiesGenerated,
        monthlyStoriesGenerated: user.monthlyStoriesGenerated,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Error during Google authentication'
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  loginWithGoogle,
  forgotPassword,
  resetPassword
}; 