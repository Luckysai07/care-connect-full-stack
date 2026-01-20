/**
 * Notification Service
 * 
 * Handles sending push notifications via Firebase Cloud Messaging (FCM)
 * and Emails via Nodemailer.
 */

import logger from '../config/logger.js';
import nodemailer from 'nodemailer';
import config from '../config/env.js';

// Create generic transporter
// In production, configure these env vars. In dev, it might fail or use Ethereal.
const emailTransporter = nodemailer.createTransport({
    // Generic SMTP or service
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

class NotificationService {
    /**
     * Send notification to a specific user
     * Tries Push first, then falls back to Email (if implemented/user has email)
     */
    static async sendToUser(userId: string, title: string, body: string, data: Record<string, any> = {}) {
        try {
            logger.info('🔔 Sending Notification', { userId, title });

            // 1. Try FCM
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                try {
                    // Dynamic import to avoid initialization errors if config is invalid
                    const { messaging } = await import('../config/firebase.js');
                    const { query } = await import('../config/database.js');

                    const result = await query('SELECT fcm_token FROM users WHERE id = $1', [userId]);

                    if (result.rows.length > 0 && result.rows[0].fcm_token && messaging) {
                        await messaging.send({
                            token: result.rows[0].fcm_token,
                            notification: { title, body },
                            data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' }
                        });
                        logger.info('✅ FCM Notification sent', { userId });
                        // We continue to email as a fallback/redundancy or return if push is enough.
                        // For now, let's treat push as primary but allow email to also fire if configured.
                    }
                } catch (e) {
                    logger.warn('FCM send failed', { error: e });
                }
            }

            // 2. Fallback to Email (Simulation or Real)
            if (process.env.EMAIL_USER) {
                const { query } = await import('../config/database.js');
                const result = await query('SELECT email FROM users WHERE id = $1', [userId]);

                if (result.rows.length > 0) {
                    await this.sendEmail(result.rows[0].email, title, body);
                }
            } else {
                logger.debug('[Notification] Email credentials not configured.');
            }

        } catch (error: any) {
            logger.error('Failed to send notification', { error: error.message });
        }
    }

    /**
     * Send email notification directly
     */
    static async sendEmail(to: string, subject: string, text: string) {
        if (!process.env.EMAIL_USER) {
            logger.warn('Email service not configured. Skipping email.', { to, subject });
            return;
        }

        try {
            await emailTransporter.sendMail({
                from: process.env.EMAIL_USER,
                to,
                subject,
                text
            });
            logger.info('📧 Email sent successfully', { to });
        } catch (error: any) {
            logger.error('Failed to send email', { error: error.message, to });
        }
    }
}

export default NotificationService;
