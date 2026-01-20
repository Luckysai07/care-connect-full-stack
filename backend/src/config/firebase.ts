import admin from 'firebase-admin';
import logger from './logger.js';

let firebaseApp: admin.app.App | null = null;

try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        logger.info('✅ Firebase Admin initialized');
    } else {
        logger.warn('⚠️ Firebase credentials not found. FCM will not work.');
    }
} catch (error: any) {
    logger.error('Failed to initialize Firebase Admin', { error: error.message });
}

export default firebaseApp;
export const messaging = firebaseApp ? firebaseApp.messaging() : null;
