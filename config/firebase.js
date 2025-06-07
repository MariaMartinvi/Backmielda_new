const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to use service account file if available
    const serviceAccountPath = path.join(__dirname, '../../cuentacuentos-b2e64-firebase-adminsdk-fbsvc-301a062f5e.json');
    
    try {
      const serviceAccount = require(serviceAccountPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://cuentacuentos-b2e64-default-rtdb.firebaseio.com"
      });
      
      console.log('🔥 Firebase Admin initialized with service account');
    } catch (error) {
      console.log('Service account file not found, trying environment variables');
      
      // Fallback to environment variables
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: "https://cuentacuentos-b2e64-default-rtdb.firebaseio.com"
      });
      
      console.log('🔥 Firebase Admin initialized with environment credentials');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    throw error;
  }
} else {
  console.log('🔥 Firebase Admin already initialized');
}

// Export Firestore database instance
const db = admin.firestore();

module.exports = {
  admin,
  db
}; 