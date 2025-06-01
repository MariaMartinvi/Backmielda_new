const express = require('express');
const router = express.Router();
const { register, login, logout, refreshToken, getCurrentUser, loginWithGoogle } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', auth, getCurrentUser);
router.post('/google', loginWithGoogle);

module.exports = router; 