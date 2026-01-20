/**
 * Users Controller
 */

import { Request, Response, NextFunction } from 'express';
import usersService from './users.service.js';

class UsersController {
    /**
     * Get current user profile
     * GET /api/users/me
     */
    async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const profile = await usersService.getProfile(req.user.id);
            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user profile by ID
     * GET /api/users/:userId
     */
    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const profile = await usersService.getProfile(req.params.userId);
            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update current user profile
     * PUT /api/users/me
     */
    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const profile = await usersService.updateProfile(req.user.id, req.body);
            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user location
     * PUT /api/users/me/location
     */
    async updateLocation(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const location = await usersService.updateLocation(req.user.id, req.body);
            res.json(location);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user location
     * GET /api/users/me/location
     */
    async getLocation(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const location = await usersService.getLocation(req.user.id);
            res.json(location);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get nearby users
     * GET /api/users/nearby
     */
    async getNearbyUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const { latitude, longitude, radius = 5000, limit = 20 } = req.query;

            const users = await usersService.getNearbyUsers(
                parseFloat(latitude as string),
                parseFloat(longitude as string),
                parseInt(radius as string),
                parseInt(limit as string)
            );

            res.json(users);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Save FCM Token
     * POST /api/users/fcm-token
     */
    async saveFcmToken(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const { token } = req.body;
            // We need to implement this in users.service too, or just direct query here for speed
            // Let's use service pattern.
            await usersService.saveFcmToken(req.user.id, token);
            res.json({ message: 'FCM token saved' });
        } catch (error) {
            next(error);
        }
    }
}

export default new UsersController();
