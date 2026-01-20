/**
 * JWT Utility Module
 * 
 * Handles JWT token generation and verification.
 * Uses environment variables for secrets and expiry times.
 */

import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../../config/env.js';
import logger from '../../config/logger.js';
import { UserRole, TokenPayload } from '../types.js';

/**
 * Generate JWT access token
 * @param payload - Token payload (userId, role, etc.)
 * @returns JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
    try {
        return jwt.sign(payload, config.jwt.accessSecret, {
            expiresIn: config.jwt.accessExpiry as any // jwt types are a bit loose with string durations
        });
    } catch (error: any) {
        logger.error('Error generating access token', {
            error: error.message
        });
        throw new Error('Failed to generate access token');
    }
}

/**
 * Generate JWT refresh token
 * @param payload - Token payload (userId)
 * @returns JWT refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
    try {
        return jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiry as any
        });
    } catch (error: any) {
        logger.error('Error generating refresh token', {
            error: error.message
        });
        throw new Error('Failed to generate refresh token');
    }
}

/**
 * Verify JWT access token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error If token is invalid or expired
 */
export function verifyAccessToken(token: string): TokenPayload {
    try {
        return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Access token expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid access token');
        }
        throw error;
    }
}

/**
 * Verify JWT refresh token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error If token is invalid or expired
 */
export function verifyRefreshToken(token: string): TokenPayload {
    try {
        return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid refresh token');
        }
        throw error;
    }
}

/**
 * Decode JWT token without verification
 * Useful for extracting payload from expired tokens
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): TokenPayload | null {
    try {
        return jwt.decode(token) as TokenPayload;
    } catch (error: any) {
        logger.error('Error decoding token', {
            error: error.message
        });
        return null;
    }
}

export default {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken
};
