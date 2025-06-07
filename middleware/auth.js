const admin = require('firebase-admin');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Checking authorization header');
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
    const decodedToken = await admin.auth().verifyIdToken(token);
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
    req.user = null;
    req.firebaseUser = null;
    next();
  }
};

module.exports = { auth, optionalAuth }; 