/**
 * Authorization Middleware
 * 
 * Checks if user has required role to access resource.
 * Must be used after authenticate middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthorizationError } from '../shared/utils/error-handler.util.js';
import logger from '../config/logger.js';
import { UserRole } from '../shared/types.js';

/**
 * Role hierarchy
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    USER: 1,
    VOLUNTEER: 2,
    PROFESSIONAL: 3,
    ADMIN: 4
};

/**
 * Check if user has required role
 * @param allowedRoles - Array of allowed roles
 * @returns Express middleware
 */
export function authorize(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                throw new AuthorizationError('User not authenticated');
            }

            // Check if user has required role
            if (!req.user.role || !allowedRoles.includes(req.user.role)) {
                logger.warn('Authorization failed', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    requiredRoles: allowedRoles,
                    path: req.path
                });

                throw new AuthorizationError('Insufficient permissions');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Check if user has minimum role level
 * @param minimumRole - Minimum required role
 * @returns Express middleware
 */
export function authorizeMinimumRole(minimumRole: UserRole) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user || !req.user.role) {
                throw new AuthorizationError('User not authenticated');
            }

            const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
            const requiredRoleLevel = ROLE_HIERARCHY[minimumRole] || 0;

            if (userRoleLevel < requiredRoleLevel) {
                logger.warn('Authorization failed - insufficient role level', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    minimumRole,
                    path: req.path
                });

                throw new AuthorizationError('Insufficient permissions');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Check if user owns the resource
 * Compares req.user.id with req.params.userId or req.params.id
 * @returns Express middleware
 */
export function authorizeOwner() {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw new AuthorizationError('User not authenticated');
            }

            // Get resource owner ID from params
            const resourceOwnerId = req.params.userId || req.params.id;

            // Admins can access any resource
            if (req.user.role === 'ADMIN') {
                return next();
            }

            // Check if user owns the resource
            if (req.user.id !== resourceOwnerId) {
                logger.warn('Authorization failed - not resource owner', {
                    userId: req.user.id,
                    resourceOwnerId,
                    path: req.path
                });

                throw new AuthorizationError('Access denied');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

export default {
    authorize,
    authorizeMinimumRole,
    authorizeOwner,
    ROLE_HIERARCHY
};
