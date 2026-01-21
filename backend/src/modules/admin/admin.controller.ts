/**
 * Admin Controller
 * 
 * Handles system administration tasks.
 */
import { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';
import logger from '../../config/logger.js';

const adminController = {
    /**
     * Get system statistics
     */
    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            // Get user counts
            const userStats = await query(`
                SELECT role, COUNT(*) as count 
                FROM users 
                GROUP BY role
            `);

            // Get SOS stats
            const sosStats = await query(`
                SELECT status, COUNT(*) as count 
                FROM sos_requests 
                GROUP BY status
            `);

            // Get total active volunteers (verified and available)
            const activeVolunteers = await query(`
                SELECT COUNT(*) as count 
                FROM volunteers 
                WHERE verified = true AND available = true
            `);

            res.json({
                users: userStats.rows,
                sos: sosStats.rows,
                activeVolunteers: parseInt(activeVolunteers.rows[0].count),
                timestamp: new Date()
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * List users with pagination
     */
    async listUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;

            const users = await query(`
                SELECT id, email, role, is_active, created_at 
                FROM users 
                ORDER BY created_at DESC 
                LIMIT $1 OFFSET $2
            `, [limit, offset]);

            const count = await query('SELECT COUNT(*) FROM users');

            res.json({
                users: users.rows,
                pagination: {
                    total: parseInt(count.rows[0].count),
                    page,
                    pages: Math.ceil(parseInt(count.rows[0].count) / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get pending volunteers
     */
    async getPendingVolunteers(req: Request, res: Response, next: NextFunction) {
        try {
            // Dynamic import to avoid circular dependency if any
            const { default: volunteersService } = await import('../volunteers/volunteers.service.js');
            const volunteers = await volunteersService.getPendingVolunteers();
            res.json(volunteers);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Verify volunteer
     */
    async verifyVolunteer(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            // @ts-ignore
            const adminId = req.user.id;

            const { default: volunteersService } = await import('../volunteers/volunteers.service.js');
            await volunteersService.verifyVolunteer(id as string, adminId);

            res.json({ message: 'Volunteer verified successfully' });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Reject volunteer
     */
    async rejectVolunteer(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            // @ts-ignore
            const adminId = req.user.id;

            const { default: volunteersService } = await import('../volunteers/volunteers.service.js');
            await volunteersService.rejectVolunteer(id as string, adminId);

            res.json({ message: 'Volunteer rejected successfully' });
        } catch (error) {
            next(error);
        }
    }
};

export default adminController;
