/**
 * SOS Validation Schemas
 */

import { z } from 'zod';
import { ValidationSchema } from '../../middleware/validate.js';
import { EMERGENCY_TYPES, SOS_STATUS } from '../../shared/constants.js';

/**
 * Create SOS schema
 */
export const createSOSSchema: ValidationSchema = {
    body: z.object({
        emergencyType: z.enum(Object.values(EMERGENCY_TYPES) as [string, ...string[]]),
        description: z.string().max(1000).optional(),
        imageUrl: z.string().url().optional(),
        latitude: z.coerce.number().min(-90).max(90),
        longitude: z.coerce.number().min(-180).max(180)
    })
};

/**
 * Get SOS params schema
 */
export const getSOSParamsSchema: ValidationSchema = {
    params: z.object({
        sosId: z.string().uuid()
    })
};

/**
 * Accept SOS schema
 */
export const acceptSOSSchema: ValidationSchema = {
    params: z.object({
        sosId: z.string().uuid()
    })
};

/**
 * Reject SOS schema
 */
export const rejectSOSSchema: ValidationSchema = {
    params: z.object({
        sosId: z.string().uuid()
    }),
    body: z.object({
        reason: z.string().max(500).optional()
    })
};

/**
 * Update SOS status schema
 */
export const updateSOSStatusSchema: ValidationSchema = {
    params: z.object({
        sosId: z.string().uuid()
    }),
    body: z.object({
        status: z.enum([SOS_STATUS.IN_PROGRESS, SOS_STATUS.RESOLVED, SOS_STATUS.CANCELLED])
    })
};

/**
 * Add feedback schema
 */
export const addFeedbackSchema: ValidationSchema = {
    params: z.object({
        sosId: z.string().uuid()
    }),
    body: z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional()
    })
};

export default {
    createSOSSchema,
    getSOSParamsSchema,
    acceptSOSSchema,
    rejectSOSSchema,
    updateSOSStatusSchema,
    addFeedbackSchema
};
