/**
 * Users Service
 * 
 * Handles user profile and location management.
 */

import { query, getClient } from '../../config/database.js';
import logger from '../../config/logger.js';
import { NotFoundError, ConflictError } from '../../shared/utils/error-handler.util.js';
import { UserRole } from '../../shared/types.js';

class UsersService {
    /**
     * Get user profile by ID
     */
    async getProfile(userId: string) {
        try {
            const result = await query(
                `SELECT u.id, u.email, u.role, u.is_active, u.created_at,
                p.name, p.phone, p.address, p.photo_url, p.preferences,
                v.skills, v.verified as volunteer_verified, v.available as volunteer_available,
                v.average_rating, v.cancellation_count,
                pr.license_number, pr.specialization, pr.hospital_affiliation,
                pr.verified as professional_verified, pr.available as professional_available
         FROM users u
         LEFT JOIN user_profiles p ON u.id = p.user_id
         LEFT JOIN volunteers v ON u.id = v.user_id
         LEFT JOIN professionals pr ON u.id = pr.user_id
         WHERE u.id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                throw new NotFoundError('User');
            }

            const user = result.rows[0];

            // Format response based on role
            const profile: any = {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                address: user.address,
                photoUrl: user.photo_url,
                role: user.role,
                isActive: user.is_active,
                preferences: user.preferences || {},
                createdAt: user.created_at
            };

            // Add role-specific data
            if (user.role === 'VOLUNTEER') {
                profile.volunteer = {
                    skills: user.skills || [],
                    verified: user.volunteer_verified,
                    available: user.volunteer_available,
                    averageRating: parseFloat(user.average_rating) || 0,
                    cancellationCount: user.cancellation_count || 0
                };
            } else if (user.role === 'PROFESSIONAL') {
                profile.professional = {
                    licenseNumber: user.license_number,
                    specialization: user.specialization,
                    hospitalAffiliation: user.hospital_affiliation,
                    verified: user.professional_verified,
                    available: user.professional_available
                };
            }

            return profile;
        } catch (error: any) {
            logger.error('Get profile failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updates: any) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Check if user exists
            const userCheck = await client.query(
                'SELECT id FROM users WHERE id = $1',
                [userId]
            );

            if (userCheck.rows.length === 0) {
                throw new NotFoundError('User');
            }

            // If phone is being updated, check for conflicts
            if (updates.phone) {
                const phoneCheck = await client.query(
                    'SELECT user_id FROM user_profiles WHERE phone = $1 AND user_id != $2',
                    [updates.phone, userId]
                );

                if (phoneCheck.rows.length > 0) {
                    throw new ConflictError('Phone number already in use');
                }
            }

            // Build update query dynamically
            const updateFields: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (updates.name !== undefined) {
                updateFields.push(`name = $${paramCount++}`);
                values.push(updates.name);
            }

            if (updates.phone !== undefined) {
                updateFields.push(`phone = $${paramCount++}`);
                values.push(updates.phone);
            }

            if (updates.address !== undefined) {
                updateFields.push(`address = $${paramCount++}`);
                values.push(updates.address);
            }

            if (updates.preferences !== undefined) {
                updateFields.push(`preferences = $${paramCount++}`);
                values.push(JSON.stringify(updates.preferences));
            }

            if (updateFields.length > 0) {
                values.push(userId);

                await client.query(
                    `UPDATE user_profiles 
           SET ${updateFields.join(', ')}, updated_at = NOW()
           WHERE user_id = $${paramCount}`,
                    values
                );
            }

            await client.query('COMMIT');

            logger.info('Profile updated', { userId });

            return await this.getProfile(userId);
        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Update profile failed', { error: error.message, userId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update user location
     */
    async updateLocation(userId: string, { latitude, longitude, accuracy = 10 }: { latitude: number, longitude: number, accuracy?: number }) {
        try {
            // Update in PostgreSQL
            await query(
                `INSERT INTO user_locations (user_id, location, accuracy_meters, updated_at)
         VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET 
           location = ST_SetSRID(ST_MakePoint($2, $3), 4326),
           accuracy_meters = $4,
           updated_at = NOW()`,
                [userId, longitude, latitude, accuracy]
            );

            logger.info('Location updated', { userId, latitude, longitude });

            return {
                latitude,
                longitude,
                accuracy,
                updatedAt: new Date()
            };
        } catch (error: any) {
            logger.error('Update location failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Get user location
     */
    async getLocation(userId: string) {
        try {
            const result = await query(
                `SELECT ST_Y(location::geometry) as latitude,
                ST_X(location::geometry) as longitude,
                accuracy_meters,
                updated_at
         FROM user_locations
         WHERE user_id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                throw new NotFoundError('Location not found');
            }

            return {
                latitude: parseFloat(result.rows[0].latitude),
                longitude: parseFloat(result.rows[0].longitude),
                accuracy: result.rows[0].accuracy_meters,
                updatedAt: result.rows[0].updated_at
            };
        } catch (error: any) {
            logger.error('Get location failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Get nearby users
     */
    async getNearbyUsers(latitude: number, longitude: number, radiusMeters: number = 5000, limit: number = 20) {
        try {
            const result = await query(
                `SELECT u.id, u.role,
                p.name, p.photo_url,
                ST_Distance(l.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)) as distance,
                v.verified, v.available, v.average_rating
         FROM user_locations l
         JOIN users u ON l.user_id = u.id
         JOIN user_profiles p ON u.id = p.user_id
         LEFT JOIN volunteers v ON u.id = v.user_id
         WHERE ST_DWithin(
           l.location,
           ST_SetSRID(ST_MakePoint($2, $1), 4326),
           $3
         )
         AND u.is_active = true
         ORDER BY distance ASC
         LIMIT $4`,
                [latitude, longitude, radiusMeters, limit]
            );

            return result.rows.map(row => ({
                id: row.id,
                name: row.name,
                photoUrl: row.photo_url,
                role: row.role as UserRole,
                distance: Math.round(row.distance),
                verified: row.verified,
                available: row.available,
                averageRating: parseFloat(row.average_rating) || 0
            }));
        } catch (error: any) {
            logger.error('Get nearby users failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Save FCM Token
     */
    async saveFcmToken(userId: string, token: string) {
        try {
            await query(
                'UPDATE users SET fcm_token = $1 WHERE id = $2',
                [token, userId]
            );
            logger.info('FCM token saved', { userId });
        } catch (error: any) {
            logger.error('Save FCM token failed', { error: error.message, userId });
            throw error;
        }
    }
}

export default new UsersService();
