const admin = require('firebase-admin');
const { db } = require('../config/firebase'); // Add Firestore import

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

// Helper function to get or create user data in Firestore
const getOrCreateUserData = async (firebaseUser) => {
  try {
    const userRef = db.collection('users').doc(firebaseUser.uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      console.log('📁 User found in Firestore:', firebaseUser.email);
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      console.log('👤 Creating new user in Firestore:', firebaseUser.email);
      const newUserData = {
        email: firebaseUser.email,
        emailVerified: firebaseUser.email_verified || false,
        firebase_uid: firebaseUser.uid,
        storiesGenerated: 0,
        monthlyStoriesGenerated: 0,
        subscriptionStatus: 'free',
        isPremium: false,
        isAdmin: false,
        lastMonthReset: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await userRef.set(newUserData);
      console.log('✅ New user created in Firestore');
      return { id: firebaseUser.uid, ...newUserData };
    }
  } catch (error) {
    console.error('❌ Error getting/creating user data:', error);
    throw error;
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
    console.log('Email verified status from Firebase:', decodedToken.email_verified);

    // Get or create user data from Firestore
    const userData = await getOrCreateUserData(decodedToken);

    // Create enhanced user object with Firestore data
    const user = {
      _id: userData.id,
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      firebase_uid: decodedToken.uid,
      storiesGenerated: userData.storiesGenerated || 0,
      monthlyStoriesGenerated: userData.monthlyStoriesGenerated || 0,
      subscriptionStatus: userData.subscriptionStatus || 'free',
      isPremium: userData.isPremium || false,
      isAdmin: userData.isAdmin || false,
      lastMonthReset: userData.lastMonthReset,
      // Add helper methods
      checkAndResetMonthlyCount: function() {
        const now = new Date();
        const lastReset = new Date(this.lastMonthReset);
        
        // Reset if it's been a month since last reset
        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
          this.monthlyStoriesGenerated = 0;
          this.lastMonthReset = now;
          
          // Update in Firestore
          db.collection('users').doc(this.uid).update({
            monthlyStoriesGenerated: 0,
            lastMonthReset: now
          }).catch(err => console.error('Error updating monthly reset:', err));
        }
      }
    };

    console.log('User object created with Firestore data:', {
      email: user.email,
      emailVerified: user.emailVerified,
      storiesGenerated: user.storiesGenerated,
      monthlyStoriesGenerated: user.monthlyStoriesGenerated,
      subscriptionStatus: user.subscriptionStatus
    });

    req.user = user;
    req.firebaseUser = decodedToken;
    req.token = token;
    console.log('Authentication successful for user:', user.email);
    console.log('🚀 Auth middleware completed successfully, calling next()');
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
      emailVerified: decodedToken.email_verified || false,
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