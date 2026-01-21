/**
 * SOS Controller
 */

import { Request, Response, NextFunction } from 'express';
import sosService from './sos.service.js';
import config from '../../config/env.js';
import AWS from 'aws-sdk';
import crypto from 'crypto';

// Initialize S3
const s3 = new AWS.S3({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.region
});

class SOSController {
    /**
     * Create SOS request
     * POST /api/sos
     */
    async createSOS(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            let imageUrl = undefined;

            // Handle file upload
            if (req.file) {
                const fileExt = req.file.originalname.split('.').pop();
                const fileName = `${crypto.randomUUID()}.${fileExt}`;

                const params = {
                    Bucket: config.aws.s3Bucket,
                    Key: `sos-proofs/${fileName}`,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                    // ACL: 'public-read' // removed as some buckets block ACLs
                };

                const result = await s3.upload(params).promise();
                imageUrl = result.Location;
            }

            const sosData = {
                ...req.body,
                imageUrl
            };

            const sos = await sosService.createSOS(req.user.id, sosData);
            res.status(201).json(sos);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get SOS details
     * GET /api/sos/:sosId
     */
    async getSOSDetails(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const sos = await sosService.getSOSDetails(req.params.sosId as string, req.user.id);
            res.json(sos);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Accept SOS request
     * POST /api/sos/:sosId/accept
     */
    async acceptSOS(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const sos = await sosService.acceptSOS(req.params.sosId as string, req.user.id);
            res.json(sos);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reject SOS request
     * POST /api/sos/:sosId/reject
     */
    async rejectSOS(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const result = await sosService.rejectSOS(
                req.params.sosId as string,
                req.user.id,
                req.body.reason
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update SOS status
     * PUT /api/sos/:sosId/status
     */
    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const sos = await sosService.updateStatus(
                req.params.sosId as string,
                req.user.id,
                req.body.status
            );
            res.json(sos);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Add feedback
     * POST /api/sos/:sosId/feedback
     */
    async addFeedback(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const result = await sosService.addFeedback(
                req.params.sosId as string,
                req.user.id,
                req.body
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user's SOS history
     * GET /api/sos/my-history
     */
    async getMyHistory(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const { limit = 20, offset = 0 } = req.query;
            const history = await sosService.getUserSOSHistory(
                req.user.id,
                parseInt(limit as string),
                parseInt(offset as string)
            );
            res.json(history);
        } catch (error) {
            next(error);
        }
    }
}

export default new SOSController();
