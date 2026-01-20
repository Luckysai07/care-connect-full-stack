/**
 * SOS Routes
 */

import express from 'express';
import sosController from './sos.controller.js';
import upload from '../../middleware/upload.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { USERS_ROLES } from '../../shared/constants.js';
import {
    createSOSSchema,
    getSOSParamsSchema,
    acceptSOSSchema,
    rejectSOSSchema,
    updateSOSStatusSchema,
    addFeedbackSchema
} from './sos.validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/sos
 * @desc    Create SOS request
 * @access  Private (USER role)
 * @note    No rate limit - users can create unlimited emergency requests
 */
router.post(
    '/',
    upload.single('image'),
    validate(createSOSSchema),
    sosController.createSOS
);

/**
 * @route   GET /api/sos/my-history
 * @desc    Get user's SOS history
 * @access  Private
 */
router.get('/my-history', sosController.getMyHistory);

/**
 * @route   GET /api/sos/:sosId
 * @desc    Get SOS details
 * @access  Private
 */
router.get(
    '/:sosId',
    validate(getSOSParamsSchema),
    sosController.getSOSDetails
);

/**
 * @route   POST /api/sos/:sosId/accept
 * @desc    Accept SOS request
 * @access  Private (VOLUNTEER, PROFESSIONAL roles)
 */
router.post(
    '/:sosId/accept',
    authorize(USERS_ROLES.VOLUNTEER, USERS_ROLES.PROFESSIONAL),
    validate(acceptSOSSchema),
    sosController.acceptSOS
);

/**
 * @route   POST /api/sos/:sosId/reject
 * @desc    Reject SOS request
 * @access  Private (VOLUNTEER, PROFESSIONAL roles)
 */
router.post(
    '/:sosId/reject',
    authorize(USERS_ROLES.VOLUNTEER, USERS_ROLES.PROFESSIONAL),
    validate(rejectSOSSchema),
    sosController.rejectSOS
);

/**
 * @route   PUT /api/sos/:sosId/status
 * @desc    Update SOS status
 * @access  Private
 */
router.put(
    '/:sosId/status',
    validate(updateSOSStatusSchema),
    sosController.updateStatus
);

/**
 * @route   POST /api/sos/:sosId/feedback
 * @desc    Add feedback for volunteer
 * @access  Private
 */
router.post(
    '/:sosId/feedback',
    validate(addFeedbackSchema),
    sosController.addFeedback
);

export default router;
