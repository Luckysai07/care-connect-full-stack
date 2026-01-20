/**
 * Authentication Validation Schemas
 * 
 * Zod schemas for validating authentication requests.
 */

import { z } from 'zod';
import { ValidationSchema } from '../../middleware/validate.js';

/**
 * Register schema
 */
export const registerSchema: ValidationSchema = {
    body: z.object({
        email: z.string()
            .email('Invalid email address')
            .toLowerCase()
            .trim(),

        password: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),

        name: z.string()
            .min(2, 'Name must be at least 2 characters')
            .max(255, 'Name must be less than 255 characters')
            .trim(),

        phone: z.string()
            // Allow + at start, optional space/dash, 10-15 digits
            .regex(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number format')
            .trim(),

        role: z.enum(['USER', 'VOLUNTEER', 'ADMIN', 'PROFESSIONAL']).optional()
    })
};

/**
 * Login schema
 */
export const loginSchema: ValidationSchema = {
    body: z.object({
        email: z.string()
            // ... (preserving email validation)
            .email('Invalid email address')
            .toLowerCase()
            .trim(),

        password: z.string()
            .min(1, 'Password is required')
            .max(100, 'Password is too long'),

        role: z.enum(['USER', 'VOLUNTEER', 'ADMIN', 'PROFESSIONAL']).optional()
    })
};

/**
 * Refresh token schema
 */
export const refreshTokenSchema: ValidationSchema = {
    body: z.object({
        refreshToken: z.string()
            .min(1, 'Refresh token is required')
    })
};

/**
 * Logout schema
 */
export const logoutSchema: ValidationSchema = {
    body: z.object({
        refreshToken: z.string()
            .min(1, 'Refresh token is required')
    })
};

export default {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    logoutSchema
};
