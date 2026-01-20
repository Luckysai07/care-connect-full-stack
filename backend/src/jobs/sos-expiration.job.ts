/**
 * SOS Expiration Job
 * 
 * Background job that automatically expires SOS requests after 2 minutes
 * Runs every 30 seconds to check for expired requests
 */

import cron from 'node-cron';
import { query } from '../config/database.js';
import logger from '../config/logger.js';
import { getIO } from '../sockets/socket.js';
import { SOS_STATUS } from '../shared/constants.js';

let isRunning = false;

/**
 * Expire old SOS requests
 */
export async function expireOldSOS() {
    if (isRunning) {
        return; // Skip if previous job still running
    }

    isRunning = true;

    try {
        // Find and expire SOS requests past their expiration time
        const result = await query(`
            UPDATE sos_requests 
            SET status = $1, 
                expired_at = NOW()
            WHERE status = $2
            AND expires_at < NOW()
            RETURNING id, user_id, emergency_type
        `, [SOS_STATUS.EXPIRED, SOS_STATUS.PENDING]);

        if (result.rows.length > 0) {
            logger.info('SOS requests expired', {
                count: result.rows.length,
                sosIds: result.rows.map(r => r.id)
            });

            // Emit socket events for expired SOS
            const io = getIO();

            result.rows.forEach(sos => {
                // Notify user their SOS expired
                io.to(`user:${sos.user_id}`).emit('sos:expired', {
                    sosId: sos.id,
                    message: 'Your SOS request expired. No volunteers were available.'
                });

                // Notify all volunteers to remove from their list
                io.emit('sos:removed', { sosId: sos.id });
            });
        }
    } catch (error: any) {
        logger.error('SOS expiration job failed', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        isRunning = false;
    }
}

/**
 * Start the expiration job
 */
export function startExpirationJob() {
    // Run every 30 seconds
    cron.schedule('*/30 * * * * *', expireOldSOS);

    logger.info('SOS expiration job started (runs every 30 seconds)');
}

export default { startExpirationJob, expireOldSOS };
