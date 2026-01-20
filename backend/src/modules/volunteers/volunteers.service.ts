/**
 * Volunteers Service
 * 
 * Handles volunteer registration, verification, and availability.
 */

import { query, getClient } from '../../config/database.js';
import logger from '../../config/logger.js';
import {
    NotFoundError,
    ValidationError,
    AuthorizationError
} from '../../shared/utils/error-handler.util.js';
import { SOS_STATUS, USERS_ROLES } from '../../shared/constants.js';

class VolunteersService {
    /**
     * Register as volunteer
     */
    async registerVolunteer(userId: string, { skills, certifications = [] }: { skills: string[], certifications?: string[] }) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Check if user exists and is not already a volunteer
            const userCheck = await client.query(
                `SELECT u.role, v.user_id
         FROM users u
         LEFT JOIN volunteers v ON u.id = v.user_id
         WHERE u.id = $1`,
                [userId]
            );

            if (userCheck.rows.length === 0) {
                throw new NotFoundError('User');
            }

            if (userCheck.rows[0].user_id) {
                throw new ValidationError('User is already registered as volunteer');
            }

            // Update user role to VOLUNTEER
            await client.query(
                'UPDATE users SET role = $1 WHERE id = $2',
                [USERS_ROLES.VOLUNTEER, userId]
            );

            // Create volunteer record
            await client.query(
                `INSERT INTO volunteers (user_id, skills, certifications, verified, available)
         VALUES ($1, $2, $3, false, false)`,
                [userId, skills, JSON.stringify(certifications)]
            );

            await client.query('COMMIT');

            logger.info('Volunteer registered', { userId });

            return {
                message: 'Volunteer registration successful. Awaiting admin verification.',
                userId,
                skills,
                verified: false,
                available: false
            };
        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Register volunteer failed', { error: error.message, userId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Toggle volunteer availability
     */
    async toggleAvailability(userId: string) {
        try {
            // Check if volunteer is verified
            const volunteerCheck = await query(
                'SELECT verified, available FROM volunteers WHERE user_id = $1',
                [userId]
            );

            if (volunteerCheck.rows.length === 0) {
                throw new NotFoundError('Volunteer not found');
            }

            if (!volunteerCheck.rows[0].verified) {
                throw new ValidationError('Volunteer not verified yet');
            }

            const currentAvailability = volunteerCheck.rows[0].available;
            const newAvailability = !currentAvailability;

            // Update availability
            await query(
                'UPDATE volunteers SET available = $1 WHERE user_id = $2',
                [newAvailability, userId]
            );

            logger.info('Volunteer availability toggled', { userId, available: newAvailability });

            return {
                available: newAvailability,
                message: `You are now ${newAvailability ? 'available' : 'unavailable'} for SOS requests`
            };
        } catch (error: any) {
            logger.error('Toggle availability failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Update volunteer location
     */
    async updateLocation(userId: string, latitude: number, longitude: number) {
        try {
            const result = await query(
                `UPDATE volunteers 
                 SET last_location = ST_SetSRID(ST_MakePoint($2, $3), 4326),
                     last_location_updated_at = NOW()
                 WHERE user_id = $1
                 RETURNING user_id`,
                [userId, longitude, latitude]
            );

            if (result.rows.length === 0) {
                throw new NotFoundError('Volunteer not found');
            }

            logger.info('Volunteer location updated', { userId, latitude, longitude });
            return { success: true };
        } catch (error: any) {
            logger.error('Update location failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Get volunteer stats
     */
    async getVolunteerStats(userId: string) {
        try {
            const result = await query(
                `SELECT 
           v.verified, v.available, v.average_rating, v.cancellation_count,
           COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'RESOLVED') as completed_sos,
           COUNT(DISTINCT s.id) FILTER (WHERE s.status IN ('ACCEPTED', 'IN_PROGRESS')) as active_sos,
           COUNT(DISTINCT f.id) as total_ratings,
           AVG(f.rating) as avg_feedback_rating
         FROM volunteers v
         LEFT JOIN sos_requests s ON v.user_id = s.accepted_by
         LEFT JOIN sos_feedback f ON v.user_id = f.volunteer_id
         WHERE v.user_id = $1
         GROUP BY v.user_id, v.verified, v.available, v.average_rating, v.cancellation_count`,
                [userId]
            );

            if (result.rows.length === 0) {
                throw new NotFoundError('Volunteer not found');
            }

            const stats = result.rows[0];

            return {
                verified: stats.verified,
                available: stats.available,
                averageRating: parseFloat(stats.average_rating) || 0,
                cancellationCount: stats.cancellation_count || 0,
                completedSOS: parseInt(stats.completed_sos) || 0,
                activeSOS: parseInt(stats.active_sos) || 0,
                totalRatings: parseInt(stats.total_ratings) || 0
            };
        } catch (error: any) {
            logger.error('Get volunteer stats failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Get volunteer's accepted SOS requests
     */
    async getAcceptedSOS(userId: string, limit: number = 20, offset: number = 0) {
        try {
            const result = await query(
                `SELECT s.id, s.emergency_type, s.priority, s.status,
                s.created_at, s.accepted_at,
                ST_Y(s.location::geometry) as latitude,
                ST_X(s.location::geometry) as longitude,
                up.name as user_name, up.phone as user_phone
         FROM sos_requests s
         LEFT JOIN user_profiles up ON s.user_id = up.user_id
         WHERE s.accepted_by = $1
         ORDER BY s.accepted_at DESC
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
                acceptedAt: row.accepted_at,
                user: {
                    name: row.user_name,
                    phone: row.user_phone
                }
            }));
        } catch (error: any) {
            logger.error('Get accepted SOS failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Get pending volunteers
     */
    async getPendingVolunteers(limit: number = 20, offset: number = 0) {
        try {
            const result = await query(
                `SELECT v.user_id, v.skills, v.certifications, v.created_at,
                        u.name, u.phone, u.email
                 FROM volunteers v
                 JOIN user_profiles u ON v.user_id = u.user_id
                 JOIN users us ON u.user_id = us.id
                 WHERE v.verified = false
                 ORDER BY v.created_at ASC
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );

            return result.rows.map(row => ({
                userId: row.user_id,
                name: row.name,
                phone: row.phone,
                email: row.email,
                skills: row.skills,
                certifications: row.certifications,
                createdAt: row.created_at
            }));
        } catch (error: any) {
            logger.error('Get pending volunteers failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Verify volunteer (Admin only)
     */
    async verifyVolunteer(volunteerId: string, adminId: string) {
        try {
            // Check if volunteer exists
            const volunteerCheck = await query(
                'SELECT user_id FROM volunteers WHERE user_id = $1',
                [volunteerId]
            );

            if (volunteerCheck.rows.length === 0) {
                throw new NotFoundError('Volunteer not found');
            }

            // Verify volunteer
            await query(
                `UPDATE volunteers
                 SET verified = true, verified_at = NOW(), verified_by = $1
                 WHERE user_id = $2`,
                [adminId, volunteerId]
            );

            logger.info('Volunteer verified', { volunteerId, adminId });

            return { message: 'Volunteer verified successfully' };
        } catch (error: any) {
            logger.error('Verify volunteer failed', { error: error.message, volunteerId });
            throw error;
        }
    }

    /**
     * Reject volunteer (Admin only)
     * Reverts user role to USER and removes volunteer record
     */
    async rejectVolunteer(volunteerId: string, adminId: string) {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            // Check if volunteer exists
            const volunteerCheck = await client.query(
                'SELECT user_id FROM volunteers WHERE user_id = $1',
                [volunteerId]
            );

            if (volunteerCheck.rows.length === 0) {
                throw new NotFoundError('Volunteer not found');
            }

            // Remove volunteer record
            await client.query(
                'DELETE FROM volunteers WHERE user_id = $1',
                [volunteerId]
            );

            // Revert user role
            await client.query(
                'UPDATE users SET role = $1 WHERE id = $2',
                [USERS_ROLES.USER, volunteerId]
            );

            await client.query('COMMIT');
            logger.info('Volunteer rejected', { volunteerId, adminId });

            return { message: 'Volunteer application rejected' };
        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Reject volunteer failed', { error: error.message, volunteerId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get incoming SOS requests (nearby, pending)
     * For now, shows all pending SOS requests
     * TODO: Add location-based filtering when volunteer location tracking is implemented
     */
    async getIncomingSOS(userId: string, maxDistance: number = 10000) {
        try {
            // Check if volunteer is available
            const volunteerCheck = await query(
                `SELECT available, verified FROM volunteers WHERE user_id = $1`,
                [userId]
            );

            if (volunteerCheck.rows.length === 0 || !volunteerCheck.rows[0].verified) {
                return [];
            }

            if (!volunteerCheck.rows[0].available) {
                logger.info('Volunteer not available', { userId });
                return [];
            }

            // Get all pending SOS requests
            // TODO: Add location-based filtering using ST_Distance when location tracking is added
            const result = await query(
                `SELECT s.id, s.emergency_type, s.description, s.created_at, s.expires_at, s.priority,
                        ST_Y(s.location::geometry) as latitude,
                        ST_X(s.location::geometry) as longitude,
                        u.id as user_id,
                        up.name as user_name, up.phone as user_phone
                 FROM sos_requests s
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN user_profiles up ON s.user_id = up.user_id
                 WHERE s.status = 'PENDING'
                 AND s.expires_at > NOW()
                 AND s.id NOT IN (
                     SELECT sos_id FROM sos_rejections WHERE volunteer_id = $1
                 )
                 ORDER BY s.created_at DESC
                 LIMIT 20`,
                [userId]
            );

            logger.info('Fetched incoming SOS requests', {
                userId,
                count: result.rows.length
            });

            return result.rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                userName: row.user_name,
                userPhone: row.user_phone,
                emergencyType: row.emergency_type,
                priority: row.priority,
                description: row.description,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                distance: null, // Will be calculated when location tracking is added
                createdAt: row.created_at,
                expiresAt: row.expires_at
            }));
        } catch (error: any) {
            logger.error('Get incoming SOS failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Accept SOS request
     */
    async acceptSOS(userId: string, sosId: string) {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            // Check if SOS is still pending
            const sosCheck = await client.query(
                'SELECT status FROM sos_requests WHERE id = $1',
                [sosId]
            );

            if (sosCheck.rows.length === 0) {
                throw new NotFoundError('SOS request not found');
            }

            if (sosCheck.rows[0].status !== SOS_STATUS.PENDING) {
                throw new ValidationError('SOS request is no longer available');
            }

            // Update SOS status
            await client.query(
                `UPDATE sos_requests 
                 SET status = 'ACCEPTED', accepted_by = $1, accepted_at = NOW()
                 WHERE id = $2`,
                [userId, sosId]
            );

            await client.query('COMMIT');
            logger.info('SOS accepted', { userId, sosId });

            return { message: 'SOS request accepted successfully' };
        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Accept SOS failed', { error: error.message, userId, sosId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Decline SOS request
     */
    async declineSOS(userId: string, sosId: string) {
        try {
            logger.info('SOS declined', { userId, sosId });
            return { message: 'SOS request declined' };
        } catch (error: any) {
            logger.error('Decline SOS failed', { error: error.message, userId, sosId });
            throw error;
        }
    }

    /**
     * Get active SOS for volunteer
     */
    async getActiveSOS(userId: string) {
        try {
            const result = await query(
                `SELECT s.id, s.emergency_type, s.description, s.status, s.created_at,
                        ST_Y(s.location::geometry) as latitude,
                        ST_X(s.location::geometry) as longitude,
                        up.name as user_name, up.phone as user_phone
                 FROM sos_requests s
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN user_profiles up ON s.user_id = up.user_id
                 WHERE s.accepted_by = $1 AND s.status IN ('ACCEPTED', 'IN_PROGRESS')
                 ORDER BY s.accepted_at DESC
                 LIMIT 1`,
                [userId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row.id,
                userName: row.user_name,
                userPhone: row.user_phone,
                emergencyType: row.emergency_type,
                description: row.description,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                status: row.status,
                createdAt: row.created_at
            };
        } catch (error: any) {
            logger.error('Get active SOS failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Complete SOS request
     */
    async completeSOS(userId: string, sosId: string) {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            // Verify volunteer owns this SOS
            const sosCheck = await client.query(
                'SELECT accepted_by FROM sos_requests WHERE id = $1',
                [sosId]
            );

            if (sosCheck.rows.length === 0) {
                throw new NotFoundError('SOS request not found');
            }

            if (sosCheck.rows[0].accepted_by !== userId) {
                throw new AuthorizationError('You are not assigned to this SOS');
            }

            // Update SOS status
            await client.query(
                `UPDATE sos_requests 
                 SET status = 'RESOLVED', resolved_at = NOW()
                 WHERE id = $1`,
                [sosId]
            );

            await client.query('COMMIT');
            logger.info('SOS completed', { userId, sosId });

            return { message: 'SOS marked as completed' };
        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Complete SOS failed', { error: error.message, userId, sosId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update availability status
     */
    async updateAvailability(userId: string, available: boolean) {
        try {
            await query(
                'UPDATE volunteers SET available = $1 WHERE user_id = $2',
                [available, userId]
            );

            logger.info('Availability updated', { userId, available });
            return { available, message: `You are now ${available ? 'available' : 'unavailable'}` };
        } catch (error: any) {
            logger.error('Update availability failed', { error: error.message, userId });
            throw error;
        }
    }
}

export default new VolunteersService();
