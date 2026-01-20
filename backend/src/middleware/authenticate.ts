/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and attaches user info to request.
 */

import { Request, Response, NextFunction } from 'express';
import jwtUtil from '../shared/utils/jwt.util.js';
import { AuthenticationError } from '../shared/utils/error-handler.util.js';
import logger from '../config/logger.js';
import { UserRole } from '../shared/types.js';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role?: UserRole;
            };
        }
    }
}

/**
 * Authenticate JWT token from Authorization header
 * Attaches user info to req.user if valid
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No token provided');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const payload = jwtUtil.verifyAccessToken(token);

        // Attach user info to request
        req.user = {
            id: payload.userId,
            role: payload.role
        };

        next();
    } catch (error: any) {
        logger.warn('Authentication failed', {
            error: error.message,
            ip: req.ip,
            path: req.path
        });

        // Use generic message for all auth failures
        next(new AuthenticationError('Authentication failed'));
    }
}

/**
 * Optional authentication
 * Attaches user info if token is present, but doesn't fail if missing
 */
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = jwtUtil.verifyAccessToken(token);

            req.user = {
                id: payload.userId,
                role: payload.role
            };
        }

        next();
    } catch (error) {
        // Ignore authentication errors for optional auth
        next();
    }
}

export default {
    authenticate,
    optionalAuthenticate
};
