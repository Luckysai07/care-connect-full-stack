/**
 * Bcrypt Utility Module
 * 
 * Handles password hashing and comparison.
 * Uses bcrypt with configurable rounds from environment.
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import config from '../../config/env.js';
import logger from '../../config/logger.js';

/**
 * Hash a password
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    try {
        const salt = await bcrypt.genSalt(config.security.bcryptRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error: any) {
        logger.error('Error hashing password', {
            error: error.message
        });
        throw new Error('Failed to hash password');
    }
}

/**
 * Compare password with hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error: any) {
        logger.error('Error comparing password', {
            error: error.message
        });
        return false;
    }
}

/**
 * Generate a random token (for password reset, etc.)
 * @param length - Token length (default 32)
 * @returns Random token
 */
export function generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

export default {
    hashPassword,
    comparePassword,
    generateToken
};
