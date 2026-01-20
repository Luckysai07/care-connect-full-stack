/**
 * Users Routes
 */

import express from 'express';
import usersController from './users.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
    getProfileParamsSchema,
    updateProfileSchema,
    updateLocationSchema
} from './users.validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', usersController.getMe);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', validate(updateProfileSchema), usersController.updateProfile);

/**
 * @route   PUT /api/users/me/location
 * @desc    Update user location
 * @access  Private
 */
router.put('/me/location', validate(updateLocationSchema), usersController.updateLocation);

/**
 * @route   GET /api/users/me/location
 * @desc    Get user location
 * @access  Private
 */
router.get('/me/location', usersController.getLocation);

/**
 * @route   GET /api/users/nearby
 * @desc    Get nearby users
 * @access  Private
 */
router.get('/nearby', usersController.getNearbyUsers);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user profile by ID
 * @access  Private
 */
router.get('/:userId', validate(getProfileParamsSchema), usersController.getProfile);

/**
 * @route   POST /api/users/fcm-token
 * @desc    Save FCM token
 * @access  Private
 */
router.post('/fcm-token', usersController.saveFcmToken);

export default router;
