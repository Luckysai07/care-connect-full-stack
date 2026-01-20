/**
 * Authentication Controller
 * 
 * Handles HTTP requests for authentication endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import authService from './auth.service.js';
import logger from '../../config/logger.js';

class AuthController {
    /**
     * Register new user
     * POST /api/auth/register
     */
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            logger.info('Auth Controller: Registration attempt', { email: req.body.email });
            const result = await authService.register(req.body);

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     * POST /api/auth/login
     */
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            logger.info('Auth Controller: Login attempt', { email: req.body.email });
            const { email, password } = req.body;

            if (!email || !password) {
                // Return 400 for missing fields, but keep message generic or specific depending on policy.
                // For security, 400 is fine for "Bad Request", but auth logic usually prefers 401 for "Invalid".
                // Here we validate structure.
                return res.status(400).json({
                    error: {
                        message: 'Email and password are required'
                    }
                });
            }

            const result = await authService.login({
                ...req.body,
                ip: req.ip
            });

            res.json(result);
        } catch (error: any) {
            // Ensure 401 for all auth failures
            if (error.statusCode === 401 || error.message.includes('Invalid')) {
                return res.status(401).json({
                    error: {
                        message: error.message || 'Invalid email or password'
                    }
                });
            }
            next(error);
        }
    }

    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.refreshToken(req.body.refreshToken);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout user
     * POST /api/auth/logout
     */
    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            await authService.logout(req.body.refreshToken);

            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();
