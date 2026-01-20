/**
 * Admin Middleware
 * 
 * Protects routes that require ADMIN role.
 * Must be placed AFTER authenticate middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthorizationError } from '../shared/utils/error-handler.util.js';
import logger from '../config/logger.js';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        logger.warn('Admin access attempted without user context', {
            path: req.path,
            ip: req.ip
        });
        return res.status(401).json({ error: { message: 'Authentication required' } });
    }

    if (req.user.role !== 'ADMIN') {
        logger.warn('Unauthorized admin access attempt', {
            userId: req.user.id,
            role: req.user.role,
            path: req.path
        });
        // 403 Forbidden: Authenticated but not authorized
        return next(new AuthorizationError('Admin access required'));
    }

    next();
}

export default requireAdmin;
