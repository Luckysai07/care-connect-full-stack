/**
 * Volunteers Routes
 */

import express from 'express';
import volunteersController from './volunteers.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { USERS_ROLES, SOS_STATUS } from '../../shared/constants.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/volunteers/register
 * @desc    Register as volunteer
 * @access  Private
 */
router.post('/register', volunteersController.register);

/**
 * @route   POST /api/volunteers/toggle-availability
 * @desc    Toggle volunteer availability
 * @access  Private (VOLUNTEER role)
 */
router.post(
    '/toggle-availability',
    authorize(USERS_ROLES.VOLUNTEER),
    volunteersController.toggleAvailability
);

/**
 * @route   GET /api/volunteers/stats
 * @desc    Get volunteer stats
 * @access  Private (VOLUNTEER role)
 */
router.get(
    '/stats',
    authorize(USERS_ROLES.VOLUNTEER),
    volunteersController.getStats
);

/**
 * @route   GET /api/volunteers/accepted-sos
 * @desc    Get accepted SOS requests
 * @access  Private (VOLUNTEER role)
 */
router.get(
    '/accepted-sos',
    authorize(USERS_ROLES.VOLUNTEER),
    volunteersController.getAcceptedSOS
);

/**
 * @route   GET /api/volunteers/incoming-sos
 * @desc    Get incoming SOS requests (nearby, pending)
 * @access  Private (VOLUNTEER role)
 */
router.get(
    '/incoming-sos',
    authorize(USERS_ROLES.VOLUNTEER),
    volunteersController.getIncomingSOS
);

/**
 * @route   POST /api/volunteers/sos/:sosId/accept
 * @desc    Accept SOS request
 * @access  Private (VOLUNTEER role)
 */
router.post(
    '/sos/:sosId/accept',
    authorize(USERS_ROLES.VOLUNTEER),
    volunteersController.acceptSOS
);

/**
 * @route   POST /api/volunteers/sos/:sosId/decline
 * @desc    Decline SOS request
 * @access  Private (VOLUNTEER role)
 */
router.post(
    '/sos/:sosId/decline',
    authorize(USERS_ROLES.VOLUNTEER),
    volunteersController.declineSOS
);

/**
 * @route   GET /api/volunteers/active-sos
 * @desc    Get active SOS for volunteer
 * @access  Private (VOLUNTEER role)
 */
router.get(
    '/active-sos',
    authorize(USERS_ROLES.VOLUNTEER),
    volunteersController.getActiveSOS
);

/**
 * @route   POST /api/volunteers/sos/:sosId/complete
 * @desc    Mark SOS as completed
 * @access  Private (VOLUNTEER role)
 */
router.post(
    '/sos/:sosId/complete',
    authorize(USERS_ROLES.VOLUNTEER),
    volunteersController.completeSOS
);

/**
 * @route   PUT /api/volunteers/availability
 * @desc    Update availability status
 * @access  Private (VOLUNTEER role)
 */
router.put(
    '/availability',
    authorize(USERS_ROLES.VOLUNTEER),
    volunteersController.updateAvailability
);

/**
 * @route   GET /api/volunteers/profile
 * @desc    Get volunteer profile
 * @access  Private (VOLUNTEER role)
 */
router.get(
    '/profile',
    authorize(USERS_ROLES.VOLUNTEER),
    volunteersController.getProfile
);

/**
 * @route   PUT /api/volunteers/location
 * @desc    Update volunteer location
 * @access  Private (VOLUNTEER role)
 */
router.put(
    '/location',
    authorize(USERS_ROLES.VOLUNTEER, USERS_ROLES.ADMIN),
    volunteersController.updateLocation
);

/**
 * @route   POST /api/volunteers/:volunteerId/verify
 * @desc    Verify volunteer (Admin only)
 * @access  Private (ADMIN role)
 */
router.post(
    '/:volunteerId/verify',
    authorize(USERS_ROLES.ADMIN),
    volunteersController.verify
);

export default router;
