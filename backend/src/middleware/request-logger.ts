/**
 * Request Logger Middleware
 * 
 * Logs HTTP requests (errors only for clean console).
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';

/**
 * Log HTTP requests
 */
function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    // Debug: Force console output to verify requests are reaching here
    logger.info(`[DEBUG] Incoming ${req.method} request to ${req.originalUrl}`);

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.logRequest(req, res, duration);
    });

    next();
}

export default requestLogger;
