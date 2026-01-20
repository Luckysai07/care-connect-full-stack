/**
 * Authentication Service
 * 
 * Handles user registration, login, token refresh, and logout.
 * Business logic for authentication operations.
 */

import bcryptUtil from '../../shared/utils/bcrypt.util.js';
import jwtUtil from '../../shared/utils/jwt.util.js';
import { query, getClient } from '../../config/database.js';
import logger from '../../config/logger.js';
import {
    ValidationError,
    AuthenticationError,
    ConflictError
} from '../../shared/utils/error-handler.util.js';
import { USERS_ROLES } from '../../shared/constants.js';
import { User, UserRole } from '../../shared/types.js';

class AuthService {
    /**
     * Register a new user
     * @param userData - User registration data
     * @returns User data with tokens
     */
    async register({ email, password, name, phone, role }: any) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Default role is USER if not provided
            const userRole = role === USERS_ROLES.VOLUNTEER ? USERS_ROLES.VOLUNTEER : USERS_ROLES.USER;

            // Check if email already exists
            const existingUser = await client.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );

            if (existingUser.rows.length > 0) {
                throw new ConflictError('Email already registered');
            }

            // Check if phone already exists
            const existingPhone = await client.query(
                'SELECT user_id FROM user_profiles WHERE phone = $1',
                [phone]
            );

            if (existingPhone.rows.length > 0) {
                throw new ConflictError('Phone number already registered');
            }

            // Hash password
            const passwordHash = await bcryptUtil.hashPassword(password);

            // Create user
            const userResult = await client.query(
                `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role, created_at`,
                [email, passwordHash, userRole]
            );

            const user = userResult.rows[0];

            // Create user profile
            await client.query(
                `INSERT INTO user_profiles (user_id, name, phone)
         VALUES ($1, $2, $3)`,
                [user.id, name, phone]
            );

            // Initialize volunteer profile if role is VOLUNTEER
            if (user.role === USERS_ROLES.VOLUNTEER) {
                // Auto-verify and make available for testing/demo purposes
                // In production, this should be false, requiring admin verification
                await client.query(
                    `INSERT INTO volunteers (user_id, verified, available)
             VALUES ($1, true, true)`,
                    [user.id]
                );

                // Initialize location (0,0) to ensure join works, updated by frontend later
                await client.query(
                    `INSERT INTO user_locations (user_id, location)
             VALUES ($1, ST_SetSRID(ST_MakePoint(0, 0), 4326))`,
                    [user.id]
                );
            }

            // Generate tokens
            const accessToken = jwtUtil.generateAccessToken({
                userId: user.id,
                role: user.role
            });

            const refreshToken = jwtUtil.generateRefreshToken({
                userId: user.id
            });

            // Store refresh token hash
            const tokenHash = await bcryptUtil.hashPassword(refreshToken);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            await client.query(
                `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
                [user.id, tokenHash, expiresAt]
            );

            await client.query('COMMIT');

            logger.info('User registered successfully', {
                userId: user.id,
                email: user.email
            });

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name,
                    role: user.role,
                    createdAt: user.created_at
                },
                accessToken,
                refreshToken
            };

        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Registration failed', {
                error: error.message,
                email
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Login user
     * @param credentials - Login credentials
     * @returns User data with tokens
     */
    async login({ email, password, role, ip }: any) {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            logger.info('Login attempt', { email, role, ip });

            // Get user with password hash and lockout info
            const result = await client.query(
                `SELECT u.id, u.email, u.password_hash, u.role, u.is_active,
                        u.failed_login_attempts, u.lockout_until,
                        p.name, p.phone, p.photo_url
                 FROM users u
                 LEFT JOIN user_profiles p ON u.id = p.user_id
                 WHERE u.email = $1`,
                [email]
            );

            if (result.rows.length === 0) {
                throw new AuthenticationError('Invalid email or password');
            }

            const user = result.rows[0];

            // 0. Check Role Match (if role is provided)
            if (role && user.role !== role) {
                logger.warn('Login blocked - Role mismatch', {
                    userId: user.id,
                    email,
                    expectedRole: user.role,
                    attemptedRole: role
                });

                // Provide clear message to user
                const portalName = user.role === 'VOLUNTEER' ? 'Volunteer' : 'User';
                throw new AuthenticationError(`Account exists but is registered as a ${portalName}. Please use the ${portalName} login option.`);
            }

            // 1. Check if account is locked
            if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
                const lockoutTime = new Date(user.lockout_until).toLocaleTimeString();
                logger.warn('Login blocked - Account locked', { userId: user.id, email });
                throw new AuthenticationError(`Account is temporarily locked. Please try again after ${lockoutTime}`);
            }

            // 2. Check if user is active (manual deactivation)
            if (!user.is_active) {
                throw new AuthenticationError('Account is deactivated');
            }

            // 3. Verify password
            const isValidPassword = await bcryptUtil.comparePassword(
                password,
                user.password_hash
            );

            if (!isValidPassword) {
                // Increment failed attempts
                const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
                let newLockoutUntil = null;

                // Lockout policy: 5 failed attempts = 15 minute lockout
                if (newFailedAttempts >= 5) {
                    newLockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
                    logger.warn('Account locked due to excessive failed attempts', { userId: user.id, email });
                }

                await client.query(
                    `UPDATE users 
                     SET failed_login_attempts = $1, 
                         lockout_until = $2 
                     WHERE id = $3`,
                    [newFailedAttempts, newLockoutUntil, user.id]
                );

                await client.query('COMMIT');

                throw new AuthenticationError('Invalid email or password');
            }

            // 4. Login Success
            // Reset failed attempts and update tracking info
            await client.query(
                `UPDATE users 
                 SET failed_login_attempts = 0, 
                     lockout_until = NULL,
                     last_login_at = NOW(),
                     last_login_ip = $1
                 WHERE id = $2`,
                [ip, user.id]
            );

            // Generate tokens
            const accessToken = jwtUtil.generateAccessToken({
                userId: user.id,
                role: user.role
            });

            const refreshToken = jwtUtil.generateRefreshToken({
                userId: user.id
            });

            // Store refresh token hash
            const tokenHash = await bcryptUtil.hashPassword(refreshToken);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await client.query(
                `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
                 VALUES ($1, $2, $3)`,
                [user.id, tokenHash, expiresAt]
            );

            await client.query('COMMIT');

            logger.info('User logged in successfully', {
                userId: user.id,
                email: user.email,
                ip
            });

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    photoUrl: user.photo_url,
                    role: user.role
                },
                accessToken,
                refreshToken
            };

        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Login failed', {
                error: error.message,
                email,
                ip
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Refresh access token
     * @param refreshToken - Refresh token
     * @returns New tokens
     */
    async refreshToken(refreshToken: string) {
        try {
            // Verify refresh token
            const payload = jwtUtil.verifyRefreshToken(refreshToken);

            // Get all refresh tokens for user
            const result = await query(
                `SELECT id, token_hash, expires_at, revoked
         FROM refresh_tokens
         WHERE user_id = $1 AND revoked = false AND expires_at > NOW()
         ORDER BY created_at DESC`,
                [payload.userId]
            );

            if (result.rows.length === 0) {
                throw new AuthenticationError('Invalid refresh token');
            }

            // Find matching token
            let matchedToken = null;
            for (const token of result.rows) {
                const isMatch = await bcryptUtil.comparePassword(
                    refreshToken,
                    token.token_hash
                );

                if (isMatch) {
                    matchedToken = token;
                    break;
                }
            }

            if (!matchedToken) {
                throw new AuthenticationError('Invalid refresh token');
            }

            // Get user data
            const userResult = await query(
                `SELECT u.id, u.email, u.role, p.name
         FROM users u
         LEFT JOIN user_profiles p ON u.id = p.user_id
         WHERE u.id = $1 AND u.is_active = true`,
                [payload.userId]
            );

            if (userResult.rows.length === 0) {
                throw new AuthenticationError('User not found or inactive');
            }

            const user = userResult.rows[0];

            // Generate new tokens
            const newAccessToken = jwtUtil.generateAccessToken({
                userId: user.id,
                role: user.role
            });

            const newRefreshToken = jwtUtil.generateRefreshToken({
                userId: user.id
            });

            // Revoke old refresh token
            await query(
                'UPDATE refresh_tokens SET revoked = true WHERE id = $1',
                [matchedToken.id]
            );

            // Store new refresh token
            const tokenHash = await bcryptUtil.hashPassword(newRefreshToken);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await query(
                `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
                [user.id, tokenHash, expiresAt]
            );

            logger.info('Token refreshed successfully', {
                userId: user.id
            });

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };

        } catch (error: any) {
            logger.error('Token refresh failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Logout user
     * @param refreshToken - Refresh token to revoke
     */
    async logout(refreshToken: string) {
        try {
            // Verify token
            let payload;
            try {
                payload = jwtUtil.verifyRefreshToken(refreshToken);
            } catch (err: any) {
                logger.warn('Logout with invalid/expired token', { error: err.message });
                return;
            }

            // Get all valid tokens for user to find the specific one
            const result = await query(
                'SELECT id, token_hash FROM refresh_tokens WHERE user_id = $1 AND revoked = false',
                [payload.userId]
            );

            // Find matching token
            let matchedTokenId = null;
            for (const token of result.rows) {
                const isMatch = await bcryptUtil.comparePassword(refreshToken, token.token_hash);
                if (isMatch) {
                    matchedTokenId = token.id;
                    break;
                }
            }

            if (matchedTokenId) {
                // Revoke ONLY the specific token
                await query(
                    'UPDATE refresh_tokens SET revoked = true WHERE id = $1',
                    [matchedTokenId]
                );

                logger.info('User logged out successfully (Session Revoked)', {
                    userId: payload.userId,
                    tokenId: matchedTokenId
                });
            } else {
                logger.warn('Logout: Token not found in database', { userId: payload.userId });
            }

        } catch (error: any) {
            logger.error('Logout failed', {
                error: error.message
            });
            // Don't throw error on logout failure
        }
    }

    /**
     * Clean up expired refresh tokens
     * Should be run periodically (e.g., daily cron job)
     */
    async cleanupExpiredTokens() {
        try {
            const result = await query(
                'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = true'
            );

            logger.info('Cleaned up expired tokens', {
                deletedCount: result.rowCount
            });

            return result.rowCount;
        } catch (error: any) {
            logger.error('Token cleanup failed', {
                error: error.message
            });
            throw error;
        }
    }
}

export default new AuthService();
