/**
 * SOS Service
 * 
 * Handles SOS request lifecycle: create, accept, reject, resolve.
 */

import { query, getClient } from '../../config/database.js';
import matchingEngine from './matching-engine.js';
import logger from '../../config/logger.js';
import {
    NotFoundError,
    ValidationError,
    AuthorizationError
} from '../../shared/utils/error-handler.util.js';
import { SOS_STATUS } from '../../shared/constants.js';
import { EmergencyType, SOSStatus } from '../../shared/types.js';
import redisClient from '../../config/redis.js';
import { getIO } from '../../sockets/socket.js';
import NotificationService from '../../services/notification.service.js';

class SOSService {
    /**
     * Create new SOS request
     */
    async createSOS(userId: string, { emergencyType, description, latitude, longitude, imageUrl }: { emergencyType: EmergencyType, description: string, latitude: number, longitude: number, imageUrl?: string }) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Calculate priority
            const priority = matchingEngine.calculatePriority(emergencyType);

            // Calculate expiration time (2 minutes from now)
            const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

            // Create SOS request
            const result = await client.query(
                `INSERT INTO sos_requests (
          user_id, emergency_type, priority, location, description, image_url, status, expires_at
        )
        VALUES (
          $1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9
        )
        RETURNING id, created_at, expires_at`,
                [userId, emergencyType, priority, longitude, latitude, description, imageUrl, SOS_STATUS.PENDING, expiresAt]
            );

            const sosId = result.rows[0].id;
            const createdAt = result.rows[0].created_at;
            const expiresAtResult = result.rows[0].expires_at;

            await client.query('COMMIT');

            logger.info('SOS created', { sosId, userId, emergencyType, priority });

            // Find and notify volunteers (async, don't wait)
            this.notifyVolunteers(sosId, latitude, longitude, emergencyType).catch(err => {
                logger.error('Notify volunteers failed', { error: err.message, sosId });
            });

            return {
                id: sosId,
                userId,
                emergencyType,
                priority,
                location: { latitude, longitude },
                description,
                status: SOS_STATUS.PENDING,
                createdAt,
                expiresAt: expiresAtResult
            };
        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Create SOS failed', { error: error.message, userId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Find and notify nearby volunteers
     */
    async notifyVolunteers(sosId: string, latitude: number, longitude: number, emergencyType: EmergencyType) {
        try {
            const volunteers = await matchingEngine.findVolunteers(
                sosId,
                latitude,
                longitude,
                emergencyType
            );

            if (volunteers.length === 0) {
                logger.warn('No volunteers available', { sosId });
                // TODO: Escalate to professionals or emergency services
                return;
            }

            logger.info('Notifying volunteers', {
                sosId,
                count: volunteers.length
            });

            // Store notified volunteers in cache
            // NOTE: Cache isn't implemented and was not imported in original JS, referencing a global `cache` or similar that didn't exist in imports.
            // Store notified volunteers in cache (1 hour expiry)
            try {
                if (redisClient.isOpen) {
                    const volunteerIds = volunteers.map(v => v.userId);
                    await redisClient.set(
                        `sos:${sosId}:notified_volunteers`,
                        JSON.stringify(volunteerIds),
                        { EX: 300 }
                    );

                    // Also cache full volunteer objects for socket usage if needed
                    await redisClient.set(
                        `sos:${sosId}:notified`,
                        JSON.stringify(volunteers),
                        { EX: 3600 }
                    );
                }
            } catch (cacheError) {
                logger.warn('Failed to cache volunteers', { error: (cacheError as Error).message });
            }

            // Send push notifications via Socket.io
            const io = getIO();
            const notificationService = NotificationService;

            volunteers.forEach(volunteer => {
                // Emit socket event to specific volunteer
                io.to(`user:${volunteer.userId}`).emit('sos:new_request', {
                    sosId,
                    emergencyType,
                    priority: matchingEngine.calculatePriority(emergencyType),
                    location: { latitude, longitude },
                    distance: volunteer.distance,
                    createdAt: new Date().toISOString()
                });

                // Send Push Notification (if implemented)
                notificationService.sendToUser(
                    volunteer.userId,
                    '🚨 Emergency Alert Nearby',
                    `New ${emergencyType} SOS request at ${Math.round(volunteer.distance)}m away.`
                );
            });

            logger.info('Notifications sent via Socket.io', {
                sosId,
                volunteerCount: volunteers.length
            });

        } catch (error: any) {
            logger.error('Notify volunteers error', { error: error.message, sosId });
            // Don't throw here to avoid failing the SOS creation response if notification fails
        }
    }

    /**
     * Get SOS details
     */
    async getSOSDetails(sosId: string, requestingUserId?: string) {
        try {
            const result = await query(
                `SELECT s.id, s.user_id, s.emergency_type, s.priority, s.description,
                s.status, s.created_at, s.accepted_at, s.resolved_at, s.expires_at,
                s.accepted_by,
                ST_Y(s.location::geometry) as latitude,
                ST_X(s.location::geometry) as longitude,
                u.email as user_email,
                up.name as user_name, up.phone as user_phone,
                vp.name as volunteer_name, vp.phone as volunteer_phone,
                vol.average_rating as volunteer_rating,
                ST_Y(vol.last_location::geometry) as volunteer_latitude,
                ST_X(vol.last_location::geometry) as volunteer_longitude,
                vol.last_location_updated_at as volunteer_location_updated_at
         FROM sos_requests s
         JOIN users u ON s.user_id = u.id
         LEFT JOIN user_profiles up ON s.user_id = up.user_id
         LEFT JOIN user_profiles vp ON s.accepted_by = vp.user_id
         LEFT JOIN volunteers vol ON s.accepted_by = vol.user_id
         WHERE s.id = $1`,
                [sosId]
            );

            if (result.rows.length === 0) {
                throw new NotFoundError('SOS request');
            }

            const sos = result.rows[0];

            const details: any = {
                id: sos.id,
                userId: sos.user_id,
                emergencyType: sos.emergency_type,
                priority: sos.priority,
                description: sos.description,
                status: sos.status,
                location: {
                    latitude: parseFloat(sos.latitude),
                    longitude: parseFloat(sos.longitude)
                },
                createdAt: sos.created_at,
                expiresAt: sos.expires_at,
                acceptedAt: sos.accepted_at,
                resolvedAt: sos.resolved_at,
                user: {
                    name: sos.user_name,
                    phone: sos.user_phone,
                    email: sos.user_email
                }
            };

            if (sos.accepted_by) {
                details.volunteer = {
                    id: sos.accepted_by,
                    name: sos.volunteer_name,
                    phone: sos.volunteer_phone,
                    rating: parseFloat(sos.volunteer_rating) || 5.0
                };

                // Add volunteer's live location if available
                if (sos.volunteer_latitude && sos.volunteer_longitude) {
                    details.volunteer.location = {
                        latitude: parseFloat(sos.volunteer_latitude),
                        longitude: parseFloat(sos.volunteer_longitude),
                        updatedAt: sos.volunteer_location_updated_at
                    };
                }
            }

            return details;
        } catch (error: any) {
            logger.error('Get SOS details failed', { error: error.message, sosId });
            throw error;
        }
    }

    /**
     * Accept SOS request
     */
    async acceptSOS(sosId: string, volunteerId: string) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Check if SOS exists and is pending
            const sosCheck = await client.query(
                'SELECT user_id, status FROM sos_requests WHERE id = $1 FOR UPDATE',
                [sosId]
            );

            if (sosCheck.rows.length === 0) {
                throw new NotFoundError('SOS request');
            }

            if (sosCheck.rows[0].status !== SOS_STATUS.PENDING) {
                throw new ValidationError('SOS request is no longer available');
            }

            // Check if volunteer is verified and available
            const volunteerCheck = await client.query(
                'SELECT verified, available FROM volunteers WHERE user_id = $1',
                [volunteerId]
            );

            if (volunteerCheck.rows.length === 0 || !volunteerCheck.rows[0].verified) {
                throw new AuthorizationError('Volunteer not verified');
            }

            if (!volunteerCheck.rows[0].available) {
                throw new ValidationError('Volunteer not available');
            }

            // Accept SOS
            await client.query(
                `UPDATE sos_requests
         SET status = $3, accepted_by = $1, accepted_at = NOW()
         WHERE id = $2`,
                [volunteerId, sosId, SOS_STATUS.ACCEPTED]
            );

            await client.query('COMMIT');

            logger.info('SOS accepted', { sosId, volunteerId });

            return await this.getSOSDetails(sosId, volunteerId);
        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Accept SOS failed', { error: error.message, sosId, volunteerId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Reject SOS request
     */
    async rejectSOS(sosId: string, volunteerId: string, reason?: string) {
        try {
            // Record rejection
            await query(
                `INSERT INTO sos_rejections (sos_id, volunteer_id, reason)
         VALUES ($1, $2, $3)
         ON CONFLICT (sos_id, volunteer_id) DO NOTHING`,
                [sosId, volunteerId, reason]
            );

            logger.info('SOS rejected', { sosId, volunteerId });

            return { message: 'SOS rejected successfully' };
        } catch (error: any) {
            logger.error('Reject SOS failed', { error: error.message, sosId, volunteerId });
            throw error;
        }
    }

    /**
     * Update SOS status
     */
    async updateStatus(sosId: string, userId: string, newStatus: SOSStatus) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Get current SOS
            const sosCheck = await client.query(
                'SELECT user_id, accepted_by, status FROM sos_requests WHERE id = $1 FOR UPDATE',
                [sosId]
            );

            if (sosCheck.rows.length === 0) {
                throw new NotFoundError('SOS request');
            }

            const sos = sosCheck.rows[0];

            // Check authorization
            if (sos.user_id !== userId && sos.accepted_by !== userId) {
                throw new AuthorizationError('Not authorized to update this SOS');
            }

            // Update status
            const updateFields = ['status = $1'];
            const values: any[] = [newStatus, sosId];

            if (newStatus === SOS_STATUS.RESOLVED) {
                updateFields.push('resolved_at = NOW()');
            }

            await client.query(
                `UPDATE sos_requests SET ${updateFields.join(', ')} WHERE id = $2`,
                values
            );

            await client.query('COMMIT');

            logger.info('SOS status updated', { sosId, newStatus });

            return await this.getSOSDetails(sosId, userId);
        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Update SOS status failed', { error: error.message, sosId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Add feedback for volunteer
     */
    async addFeedback(sosId: string, userId: string, { rating, comment }: { rating: number, comment: string }) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Check if SOS exists and is resolved
            const sosCheck = await client.query(
                'SELECT user_id, accepted_by, status FROM sos_requests WHERE id = $1',
                [sosId]
            );

            if (sosCheck.rows.length === 0) {
                throw new NotFoundError('SOS request');
            }

            const sos = sosCheck.rows[0];

            if (sos.user_id !== userId) {
                throw new AuthorizationError('Only the SOS creator can add feedback');
            }

            if (!sos.accepted_by) {
                throw new ValidationError('No volunteer to rate');
            }

            if (sos.status !== SOS_STATUS.RESOLVED) {
                throw new ValidationError('Can only rate resolved SOS requests');
            }

            // Add feedback
            await client.query(
                `INSERT INTO sos_feedback (sos_id, volunteer_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (sos_id) DO UPDATE
         SET rating = $3, comment = $4`,
                [sosId, sos.accepted_by, rating, comment]
            );

            await client.query('COMMIT');

            logger.info('Feedback added', { sosId, volunteerId: sos.accepted_by, rating });

            return { message: 'Feedback submitted successfully' };
        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Add feedback failed', { error: error.message, sosId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get user's SOS history
     */
    async getUserSOSHistory(userId: string, limit: number = 20, offset: number = 0) {
        try {
            const result = await query(
                `SELECT s.id, s.emergency_type, s.priority, s.status,
                s.created_at, s.resolved_at,
                ST_Y(s.location::geometry) as latitude,
                ST_X(s.location::geometry) as longitude,
                v.name as volunteer_name
         FROM sos_requests s
         LEFT JOIN user_profiles v ON s.accepted_by = v.user_id
         WHERE s.user_id = $1
         ORDER BY s.created_at DESC
         LIMIT $2 OFFSET $3`,
                [userId, limit, offset]
            );

            return result.rows.map(row => ({
                id: row.id,
                emergencyType: row.emergency_type,
                priority: row.priority,
                status: row.status,
                location: {
                    latitude: parseFloat(row.latitude),
                    longitude: parseFloat(row.longitude)
                },
                createdAt: row.created_at,
                resolvedAt: row.resolved_at,
                volunteerName: row.volunteer_name
            }));
        } catch (error: any) {
            logger.error('Get SOS history failed', { error: error.message, userId });
            throw error;
        }
    }
}

export default new SOSService();
