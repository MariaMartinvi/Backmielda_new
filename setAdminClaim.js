const admin = require('firebase-admin');

// Update the path to your service account key file
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = 'admin@audiogretel.com';

admin.auth().getUserByEmail(email)
  .then(user => {
    return admin.auth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log('✅ Custom claim set for admin user!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error setting custom claim:', error);
    process.exit(1);
  });