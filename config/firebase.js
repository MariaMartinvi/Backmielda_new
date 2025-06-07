const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Check for required environment variables first
    const requiredEnvVars = {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || 'cuentacuentos-b2e64',
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'cuentacuentos-b2e64.firebasestorage.app'
    };

    console.log('🔥 Firebase configuration check:');
    console.log('Project ID:', requiredEnvVars.projectId);
    console.log('Client Email:', requiredEnvVars.clientEmail ? 'Set' : 'Not set');
    console.log('Private Key:', requiredEnvVars.privateKey ? 'Set' : 'Not set');
    console.log('Storage Bucket:', requiredEnvVars.storageBucket);

    // Try different initialization methods
    let initialized = false;

    // Method 1: Try service account file (development)
    if (!initialized) {
      try {
        const serviceAccountPath = path.join(__dirname, '../../cuentacuentos-b2e64-firebase-adminsdk-fbsvc-301a062f5e.json');
        const serviceAccount = require(serviceAccountPath);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://cuentacuentos-b2e64-default-rtdb.firebaseio.com",
          storageBucket: requiredEnvVars.storageBucket
        });
        
        console.log('🔥 Firebase Admin initialized with service account file');
        initialized = true;
      } catch (error) {
        console.log('ℹ️ Service account file not found, trying environment variables');
      }
    }

    // Method 2: Try environment variables (production)
    if (!initialized && requiredEnvVars.privateKey && requiredEnvVars.clientEmail) {
      try {
        // Parse the private key (it might be escaped)
        const privateKey = requiredEnvVars.privateKey.replace(/\\n/g, '\n');
        
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: requiredEnvVars.projectId,
            clientEmail: requiredEnvVars.clientEmail,
            privateKey: privateKey
          }),
          databaseURL: "https://cuentacuentos-b2e64-default-rtdb.firebaseio.com",
          storageBucket: requiredEnvVars.storageBucket
        });
        
        console.log('🔥 Firebase Admin initialized with environment variables');
        initialized = true;
      } catch (error) {
        console.error('❌ Error initializing with environment variables:', error.message);
      }
    }

    // Method 3: Try application default credentials with explicit project ID
    if (!initialized) {
      try {
        // Set the project ID explicitly in environment
        process.env.GOOGLE_CLOUD_PROJECT = requiredEnvVars.projectId;
        process.env.GCLOUD_PROJECT = requiredEnvVars.projectId;
        
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: requiredEnvVars.projectId,
          databaseURL: "https://cuentacuentos-b2e64-default-rtdb.firebaseio.com",
          storageBucket: requiredEnvVars.storageBucket
        });
        
        console.log('🔥 Firebase Admin initialized with application default credentials');
        initialized = true;
      } catch (error) {
        console.error('❌ Error with application default credentials:', error.message);
      }
    }

    // Method 4: Minimal initialization with just project ID (last resort)
    if (!initialized) {
      try {
        // For basic functionality, we can initialize with minimal config
        admin.initializeApp({
          projectId: requiredEnvVars.projectId,
          databaseURL: "https://cuentacuentos-b2e64-default-rtdb.firebaseio.com",
          storageBucket: requiredEnvVars.storageBucket
        });
        
        console.log('🔥 Firebase Admin initialized with minimal configuration');
        console.log('⚠️ Warning: Limited functionality - only basic operations available');
        initialized = true;
      } catch (error) {
        console.error('❌ Error with minimal initialization:', error.message);
      }
    }

    if (!initialized) {
      throw new Error('Failed to initialize Firebase Admin with all methods');
    }

  } catch (error) {
    console.error('❌ Critical error initializing Firebase Admin:', error);
    
    // Add helpful debugging information
    console.error('Environment variables check:');
    console.error('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || 'Not set');
    console.error('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID || 'Not set');
    console.error('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Not set');
    console.error('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Not set');
    console.error('FIREBASE_STORAGE_BUCKET:', process.env.FIREBASE_STORAGE_BUCKET || 'Not set');
    console.error('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Not set');
    
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