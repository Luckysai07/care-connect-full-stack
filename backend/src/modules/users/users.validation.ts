/**
 * Users Validation Schemas
 */

import { z } from 'zod';
import { ValidationSchema } from '../../middleware/validate.js';

/**
 * Get profile params schema
 */
export const getProfileParamsSchema: ValidationSchema = {
    params: z.object({
        userId: z.string().uuid('Invalid user ID format')
    })
};

/**
 * Update profile schema
 */
export const updateProfileSchema: ValidationSchema = {
    body: z.object({
        name: z.string().min(2).max(255).trim().optional(),
        phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).trim().optional(),
        address: z.string().max(500).trim().optional(),
        preferences: z.record(z.any()).optional()
    })
};

/**
 * Update location schema
 */
export const updateLocationSchema: ValidationSchema = {
    body: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracy: z.number().min(0).optional()
    })
};

export default {
    getProfileParamsSchema,
    updateProfileSchema,
    updateLocationSchema
};
