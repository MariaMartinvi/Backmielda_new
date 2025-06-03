const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Auth routes
router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);
router.post('/logout', auth, logout);
router.post('/refresh-token', auth, refreshToken);
router.get('/me', auth, getCurrentUser);
router.post('/google', loginWithGoogle);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router; 