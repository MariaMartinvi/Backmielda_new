const admin = require('firebase-admin');

// Helper function to check if Firebase is properly initialized
const checkFirebaseInit = () => {
  try {
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin not initialized');
      return false;
    }
    
    const app = admin.app();
    if (!app) {
      console.error('❌ Firebase app not available');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization check failed:', error.message);
    return false;
  }
};

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Checking authorization header');
    
    // Check if Firebase is properly initialized
    if (!checkFirebaseInit()) {
      console.error('❌ Firebase not properly initialized, cannot verify tokens');
      return res.status(500).json({ 
        error: 'Authentication service unavailable',
        message: 'Firebase authentication service is not properly configured' 
      });
    }
    
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'None');

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

    console.log('Verifying Firebase ID token');
    
    // Add timeout to prevent hanging requests
    const verifyPromise = admin.auth().verifyIdToken(token);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Token verification timeout')), 10000);
    });
    
    const decodedToken = await Promise.race([verifyPromise, timeoutPromise]);
    
    console.log('Firebase token verified successfully, user ID:', decodedToken.uid);
    console.log('User email from token:', decodedToken.email);

    // Create a user object based on Firebase token data
    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified || false,
      firebase_uid: decodedToken.uid
    };

    req.user = user;
    req.firebaseUser = decodedToken;
    req.token = token;
    console.log('Authentication successful for user:', user.email);
    next();
  } catch (error) {
    console.error('Auth middleware error:', {
      name: error.name,
      message: error.message,
      code: error.code
    });

    // Handle specific Firebase initialization errors
    if (error.message.includes('Unable to detect a Project Id') || 
        error.message.includes('Project Id in the current environment')) {
      console.error('❌ Firebase Project ID not configured properly');
      return res.status(500).json({ 
        error: 'Authentication service configuration error',
        message: 'Firebase project configuration is missing. Please contact support.' 
      });
    }

    if (error.message === 'Token verification timeout') {
      console.error('❌ Token verification timed out');
      return res.status(408).json({ 
        error: 'Authentication timeout',
        message: 'Token verification took too long. Please try again.' 
      });
    }

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again' 
      });
    }
    
    if (error.code === 'auth/invalid-id-token' || error.code === 'auth/argument-error') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid' 
      });
    }
    
    // Handle network or Firebase service errors
    if (error.code === 'auth/network-request-failed') {
      return res.status(503).json({ 
        error: 'Authentication service unavailable',
        message: 'Unable to verify authentication. Please try again.' 
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
      req.firebaseUser = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      req.firebaseUser = null;
      return next();
    }

    // Check Firebase initialization for optional auth too
    if (!checkFirebaseInit()) {
      console.warn('⚠️ Firebase not initialized, skipping optional auth');
      req.user = null;
      req.firebaseUser = null;
      return next();
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified || false,
      firebase_uid: decodedToken.uid
    };
    
    req.user = user;
    req.firebaseUser = decodedToken;
    req.token = token;
    
    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    console.warn('⚠️ Optional auth failed, continuing without user:', error.message);
    req.user = null;
    req.firebaseUser = null;
    next();
  }
};

module.exports = { auth, optionalAuth }; 