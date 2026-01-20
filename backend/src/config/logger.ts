/**
 * Logger Configuration Module
 * 
 * Clean, minimal logging for development.
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from './env.js';

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.filePath);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Clean console format for development
 */
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, method, url, statusCode, duration, error }) => {
        let msg = `${timestamp} [${level}]: ${message}`;

        // Add HTTP request details if present
        if (method && url) {
            msg += ` ${method} ${url}`;
            if (statusCode) msg += ` ${statusCode}`;
            if (duration) msg += ` (${duration})`;
        }

        // Add error details if present
        if (error) {
            msg += ` - ${error}`;
        }

        return msg;
    })
);

/**
 * File log format (JSON for parsing)
 */
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Define custom interface for our logger
export interface CustomLogger extends winston.Logger {
    logRequest: (req: any, res: any, duration: number) => void;
}

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
    level: config.logging.level,
    format: fileFormat,
    defaultMeta: {
        service: 'careconnect',
        env: config.server.env
    },
    transports: [
        // Write all logs to file
        new winston.transports.File({
            filename: config.logging.filePath,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // Write errors to separate file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
}) as CustomLogger;

/**
 * Add console transport in development (clean output)
 */
if (config.isDevelopment()) {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'info' // Only show info and above (skip debug)
    }));
}

/**
 * Log HTTP request (only errors and warnings, plus success in dev)
 */
logger.logRequest = (req: any, res: any, duration: number) => {
    if (res.statusCode >= 500) {
        logger.error('Request Failed', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    } else if (res.statusCode >= 400) {
        logger.warn('Request Error', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    } else {
        // Log successful requests in development for visibility
        if (config.isDevelopment()) {
            logger.info('Request Completed', {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration: `${duration}ms`
            });
        }
    }
};

export default logger;
