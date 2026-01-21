/**
 * Volunteers Controller
 */

import { Request, Response, NextFunction } from 'express';
import volunteersService from './volunteers.service.js';

class VolunteersController {
    /**
     * Register as volunteer
     * POST /api/volunteers/register
     */
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const result = await volunteersService.registerVolunteer(req.user.id, req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Toggle availability
     * POST /api/volunteers/toggle-availability
     */
    async toggleAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const result = await volunteersService.toggleAvailability(req.user.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get volunteer stats
     * GET /api/volunteers/stats
     */
    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const stats = await volunteersService.getVolunteerStats(req.user.id);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get accepted SOS requests
     * GET /api/volunteers/accepted-sos
     */
    async getAcceptedSOS(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const { limit = 20, offset = 0 } = req.query;
            const sos = await volunteersService.getAcceptedSOS(
                req.user.id,
                parseInt(limit as string),
                parseInt(offset as string)
            );
            res.json(sos);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify volunteer (Admin only)
     * POST /api/volunteers/:volunteerId/verify
     */
    async verify(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const result = await volunteersService.verifyVolunteer(
                req.params.volunteerId as string,
                req.user.id
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get incoming SOS requests
     * GET /api/volunteers/incoming-sos
     */
    async getIncomingSOS(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const sos = await volunteersService.getIncomingSOS(req.user.id);
            res.json(sos);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Accept SOS request
     * POST /api/volunteers/sos/:sosId/accept
     */
    async acceptSOS(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const result = await volunteersService.acceptSOS(req.user.id, req.params.sosId as string);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Decline SOS request
     * POST /api/volunteers/sos/:sosId/decline
     */
    async declineSOS(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const result = await volunteersService.declineSOS(req.user.id, req.params.sosId as string);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get active SOS
     * GET /api/volunteers/active-sos
     */
    async getActiveSOS(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const sos = await volunteersService.getActiveSOS(req.user.id);
            res.json(sos);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Complete SOS request
     * POST /api/volunteers/sos/:sosId/complete
     */
    async completeSOS(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const result = await volunteersService.completeSOS(req.user.id, req.params.sosId as string);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update availability
     * PUT /api/volunteers/availability
     */
    async updateAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const { available } = req.body;
            const result = await volunteersService.updateAvailability(req.user.id, available);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get volunteer profile
     * GET /api/volunteers/profile
     */
    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const stats = await volunteersService.getVolunteerStats(req.user.id);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update volunteer location
     * PUT /api/volunteers/location
     */
    async updateLocation(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const { latitude, longitude } = req.body;
            await volunteersService.updateLocation(req.user.id, latitude, longitude);
            res.json({ success: true, message: 'Location updated' });
        } catch (error) {
            next(error);
        }
    }
}

export default new VolunteersController();
