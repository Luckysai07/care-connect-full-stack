/**
 * Global Error Handler Middleware
 * 
 * Catches all errors and sends appropriate responses.
 * Must be the last middleware in the chain.
 */

import { Request, Response, NextFunction } from 'express';
import { formatErrorResponse, isOperationalError } from '../shared/utils/error-handler.util.js';
import logger from '../config/logger.js';
import config from '../config/env.js';

/**
 * Global error handling middleware
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    // Log error
    if (isOperationalError(err)) {
        logger.warn('Operational error', {
            error: err.message,
            code: err.code,
            statusCode: err.statusCode,
            path: req.path,
            method: req.method,
            userId: (req as any).user?.id
        });
    } else {
        logger.error('Programming error', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            userId: (req as any).user?.id
        });
    }

    // Determine status code
    const statusCode = err.statusCode || 500;

    // Format error response
    const errorResponse = formatErrorResponse(err);

    // Add stack trace in development
    if (config.isDevelopment() && err.stack) {
        errorResponse.error.stack = err.stack;
    }

    // Send response
    res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export function notFoundHandler(req: Request, res: Response) {
    logger.warn('Route not found', {
        path: req.path,
        method: req.method
    });

    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`
        }
    });
}

export default {
    errorHandler,
    notFoundHandler
};
