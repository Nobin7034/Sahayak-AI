import admin from 'firebase-admin';

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  try {
    // Preferred: provide a JSON string in FIREBASE_ADMIN_CREDENTIALS
    const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS;
    if (credentialsJson) {
      const credentialObj = JSON.parse(credentialsJson);
      admin.initializeApp({
        credential: admin.credential.cert(credentialObj),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Fallback: GOOGLE_APPLICATION_CREDENTIALS points to a JSON file path
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else {
      console.warn('⚠️ Firebase Admin not configured: set FIREBASE_ADMIN_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS');
    }
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', err);
  }
}

export default admin;