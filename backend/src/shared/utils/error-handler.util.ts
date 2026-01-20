/**
 * Error Handler Utility Module
 * 
 * Provides custom error classes and error handling utilities.
 */

/**
 * Base API Error class
 */
export class APIError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends APIError {
    public readonly details: any[];

    constructor(message: string, details: any[] = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends APIError {
    constructor(message: string = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends APIError {
    constructor(message: string = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends APIError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends APIError {
    constructor(message: string = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends APIError {
    constructor(message: string = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}

/**
 * Format error response
 * @param error - Error object
 * @returns Formatted error response
 */
export function formatErrorResponse(error: any) {
    // Operational errors (known errors)
    if (error.isOperational) {
        const response: any = {
            error: {
                code: error.code,
                message: error.message
            }
        };

        // Add details for validation errors
        if ((error as ValidationError).details) {
            response.error.details = (error as ValidationError).details;
        }

        return response;
    }

    // Programming errors (unknown errors)
    // Don't expose internal details in production
    return {
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
        }
    };
}

/**
 * Check if error is operational
 * @param error - Error object
 * @returns True if operational error
 */
export function isOperationalError(error: any): boolean {
    return error.isOperational === true;
}

export default {
    APIError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    formatErrorResponse,
    isOperationalError
};
