import express from 'express';
const router = express.Router();
import adminController from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import requireAdmin from '../../middleware/admin.js';

// All routes require authentication AND admin role
router.use(authenticate);
router.use(requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);

// Volunteer Verification
router.get('/volunteers/pending', adminController.getPendingVolunteers);
router.post('/volunteers/:id/verify', adminController.verifyVolunteer);
router.post('/volunteers/:id/reject', adminController.rejectVolunteer);

export default router;
