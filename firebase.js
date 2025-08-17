import admin from 'firebase-admin';
import config from './app/config.js';
import logger from './utils/logger.js';

if (!admin.apps.length) {
  const serviceAccountKey = JSON.parse(config.firebaseServiceAccountKey);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
  });
  logger.info('Firebase Admin SDK initialized.');
}

const db = admin.firestore();

export { admin, db }; 