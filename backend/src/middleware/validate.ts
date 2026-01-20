/**
 * Validation Middleware
 * 
 * Validates request data using Zod schemas.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodObject } from 'zod';
import { ValidationError } from '../shared/utils/error-handler.util.js';
import logger from '../config/logger.js';

export interface ValidationSchema {
    body?: AnyZodObject | ZodObject<any>;
    params?: AnyZodObject | ZodObject<any>;
    query?: AnyZodObject | ZodObject<any>;
}

/**
 * Validate request data against Zod schema
 * @param schema - Zod schema object with optional body, params, query
 * @returns Express middleware
 */
export function validate(schema: ValidationSchema) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validationErrors: any[] = [];

            // Validate request body
            if (schema.body) {
                try {
                    req.body = await schema.body.parseAsync(req.body);
                } catch (error: any) {
                    validationErrors.push({
                        field: 'body',
                        errors: error.errors.map((err: any) => ({
                            path: err.path.join('.'),
                            message: err.message
                        }))
                    });
                }
            }

            // Validate request params
            if (schema.params) {
                try {
                    req.params = await schema.params.parseAsync(req.params);
                } catch (error: any) {
                    validationErrors.push({
                        field: 'params',
                        errors: error.errors.map((err: any) => ({
                            path: err.path.join('.'),
                            message: err.message
                        }))
                    });
                }
            }

            // Validate request query
            if (schema.query) {
                try {
                    req.query = await schema.query.parseAsync(req.query);
                } catch (error: any) {
                    validationErrors.push({
                        field: 'query',
                        errors: error.errors.map((err: any) => ({
                            path: err.path.join('.'),
                            message: err.message
                        }))
                    });
                }
            }

            // If validation errors, throw ValidationError
            if (validationErrors.length > 0) {
                // Enhance logging to show specific validation failures
                const errorDetails = validationErrors.map(err => ({
                    field: err.field,
                    details: err.errors ? err.errors.map((e: any) => `${e.path}: ${e.message}`).join(', ') : 'Unknown error'
                }));

                logger.warn('Validation failed', {
                    path: req.path,
                    errors: errorDetails,
                    fullErrors: JSON.stringify(validationErrors)
                });

                throw new ValidationError('Validation failed', validationErrors);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

export default {
    validate
};
