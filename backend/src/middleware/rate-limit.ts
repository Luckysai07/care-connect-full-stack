/**
 * Rate Limiting Middleware
 * 
 * Prevents abuse by limiting request rates.
 * Uses in-memory store (Redis optional for development).
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import config from '../config/env.js';
import { RateLimitError } from '../shared/utils/error-handler.util.js';
import logger from '../config/logger.js';

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    limit: config.security.rateLimitMaxRequests,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true, // draft-6: `RateLimit-*` headers;
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path
        });

        const error = new RateLimitError();
        res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message
            }
        });
    }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    limit: 50, // Increased for testing/demo purposes
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            email: req.body.email
        });

        const error = new RateLimitError('Too many authentication attempts');
        res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message
            }
        });
    }
});

/**
 * SOS creation rate limiter
 * 3 requests per hour per user
 */
export const sosLimiter = rateLimit({
    windowMs: config.security.sosRateLimitWindowMs,
    limit: config.security.sosRateLimitMax,
    keyGenerator: (req: Request) => {
        // Use user ID instead of IP for authenticated requests
        return (req as any).user ? (req as any).user.id : req.ip;
    },
    message: 'You have reached the maximum SOS requests per hour',
    handler: (req: Request, res: Response) => {
        logger.warn('SOS rate limit exceeded', {
            userId: (req as any).user?.id,
            ip: req.ip
        });

        const error = new RateLimitError('Maximum SOS requests per hour exceeded');
        res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message
            }
        });
    }
});

export default {
    apiLimiter,
    authLimiter,
    sosLimiter
};
