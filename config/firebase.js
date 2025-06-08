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
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Project ID:', requiredEnvVars.projectId);
    console.log('Client Email:', requiredEnvVars.clientEmail ? 'Set (' + requiredEnvVars.clientEmail.substring(0, 20) + '...)' : 'Not set');
    console.log('Private Key:', requiredEnvVars.privateKey ? 'Set (length: ' + requiredEnvVars.privateKey.length + ')' : 'Not set');
    console.log('Storage Bucket:', requiredEnvVars.storageBucket);

    // Try different initialization methods
    let initialized = false;

    // Method 1: Try environment variables first (production priority)
    if (!initialized && requiredEnvVars.privateKey && requiredEnvVars.clientEmail) {
      try {
        console.log('🔧 Attempting initialization with environment variables...');
        
        // Parse the private key (it might be escaped)
        let privateKey = requiredEnvVars.privateKey;
        
        // Handle different escaping scenarios
        if (privateKey.includes('\\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
        
        // Ensure the key starts and ends correctly
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          console.error('❌ Private key format appears incorrect');
          throw new Error('Invalid private key format');
        }
        
        const serviceAccountConfig = {
          projectId: requiredEnvVars.projectId,
          clientEmail: requiredEnvVars.clientEmail,
          privateKey: privateKey
        };
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountConfig),
          databaseURL: "https://cuentacuentos-b2e64-default-rtdb.firebaseio.com",
          storageBucket: requiredEnvVars.storageBucket
        });
        
        console.log('✅ Firebase Admin initialized with environment variables');
        
        // Test the connection asynchronously (don't block startup)
        setImmediate(async () => {
          try {
            await admin.auth().listUsers(1);
            console.log('✅ Firebase Auth connection verified');
          } catch (verifyError) {
            console.warn('⚠️ Firebase Auth verification failed:', verifyError.message);
          }
        });
        
        initialized = true;
      } catch (error) {
        console.error('❌ Error initializing with environment variables:', error.message);
        console.error('Error details:', {
          code: error.code,
          errorInfo: error.errorInfo
        });
      }
    }

    // Method 2: Try service account file (development)
    if (!initialized) {
      try {
        console.log('🔧 Attempting initialization with service account file...');
        const serviceAccountPath = path.join(__dirname, '../../cuentacuentos-b2e64-firebase-adminsdk-fbsvc-301a062f5e.json');
        const serviceAccount = require(serviceAccountPath);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://cuentacuentos-b2e64-default-rtdb.firebaseio.com",
          storageBucket: requiredEnvVars.storageBucket
        });
        
        console.log('✅ Firebase Admin initialized with service account file');
        initialized = true;
      } catch (error) {
        console.log('ℹ️ Service account file not found, trying application default credentials');
      }
    }

    // Method 3: Try application default credentials with explicit project ID
    if (!initialized) {
      try {
        console.log('🔧 Attempting initialization with application default credentials...');
        
        // Set the project ID explicitly in environment
        process.env.GOOGLE_CLOUD_PROJECT = requiredEnvVars.projectId;
        process.env.GCLOUD_PROJECT = requiredEnvVars.projectId;
        
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: requiredEnvVars.projectId,
          databaseURL: "https://cuentacuentos-b2e64-default-rtdb.firebaseio.com",
          storageBucket: requiredEnvVars.storageBucket
        });
        
        console.log('✅ Firebase Admin initialized with application default credentials');
        initialized = true;
      } catch (error) {
        console.error('❌ Error with application default credentials:', error.message);
      }
    }

    if (!initialized) {
      console.error('❌ CRITICAL: Failed to initialize Firebase Admin with all methods');
      console.error('This will cause authentication failures in production');
      
      // Add more detailed debugging for production
      console.error('🔍 Debug Information:');
      console.error('NODE_ENV:', process.env.NODE_ENV);
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('FIREBASE') || key.includes('GOOGLE')));
      
      throw new Error('Failed to initialize Firebase Admin - all initialization methods exhausted');
    }

    // Verify Firestore connection asynchronously (don't block startup)
    setImmediate(async () => {
      try {
        const db = admin.firestore();
        await db.collection('_health_check').doc('test').get();
        console.log('✅ Firestore connection verified');
      } catch (firestoreError) {
        console.warn('⚠️ Firestore connection verification failed:', firestoreError.message);
      }
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR: Firebase Admin initialization failed completely');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Add comprehensive debugging information
    console.error('🔍 Environment Debug Info:');
    console.error('NODE_ENV:', process.env.NODE_ENV || 'Not set');
    console.error('Available Firebase env vars:');
    ['FIREBASE_PROJECT_ID', 'GOOGLE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_STORAGE_BUCKET', 'GOOGLE_APPLICATION_CREDENTIALS'].forEach(envVar => {
      const value = process.env[envVar];
      console.error(`${envVar}:`, value ? (envVar.includes('PRIVATE_KEY') ? 'Set (hidden)' : `Set (${value.substring(0, 20)}...)`) : 'Not set');
    });
    
    // Don't throw in production to prevent complete app failure
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️ WARNING: Continuing without Firebase in production (this will cause auth failures)');
    } else {
      throw error;
    }
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