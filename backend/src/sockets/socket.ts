/**
 * Socket.io Server Setup
 * 
 * Handles real-time communication for SOS notifications, chat, and location updates.
 */

import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwtUtil from '../shared/utils/jwt.util.js';
import config from '../config/env.js';
import logger from '../config/logger.js';
import NotificationService from '../services/notification.service.js';
import { query } from '../config/database.js';

import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { TokenPayload, UserRole } from '../shared/types.js';

// Extend Socket interface to include authentication data
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: UserRole;
}

let io: Server;

/**
 * Initialize Socket.io server
 */
export async function initializeSocketIO(httpServer: HttpServer) {
    // Create Socket.io server
    io = new Server(httpServer, {
        cors: {
            origin: config.server.allowedOrigins,
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Redis Adapter (for scaling)
    if (process.env.REDIS_URL) {
        try {
            const pubClient = createClient({ url: process.env.REDIS_URL });
            const subClient = pubClient.duplicate();

            await Promise.all([pubClient.connect(), subClient.connect()]);

            io.adapter(createAdapter(pubClient, subClient));
            logger.info('✅ Redis Adapter initialized for Socket.io');
        } catch (error: any) {
            logger.warn('Failed to initialize Redis Adapter', { error: error.message });
        }
    } else {
        logger.info('Socket.io server initialized (Memory Adapter)');
    }

    // Authentication middleware
    io.use((socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            // Verify JWT token
            const payload = jwtUtil.verifyAccessToken(token) as TokenPayload;

            // Attach user info to socket
            socket.userId = payload.userId;
            socket.userRole = payload.role;

            logger.info('Socket authenticated', {
                socketId: socket.id,
                userId: socket.userId
            });

            next();
        } catch (error: any) {
            logger.error('Socket authentication failed', {
                error: error.message
            });
            next(new Error('Authentication failed'));
        }
    });

    // Connection handler
    io.on('connection', (socket: AuthenticatedSocket) => {
        logger.info('Client connected', {
            socketId: socket.id,
            userId: socket.userId
        });

        // Join user's personal room
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
        }

        // Join role-based room
        if (socket.userRole === 'VOLUNTEER' || socket.userRole === 'PROFESSIONAL') {
            socket.join('responders');
        }

        // ============================================
        // SOS EVENTS
        // ============================================

        /**
         * Notify volunteers about new SOS
         */
        socket.on('sos:notify_volunteers', async (data) => {
            try {
                const { sosId, volunteers } = data;

                // Notify each volunteer
                volunteers.forEach((volunteer: any) => {
                    // Send Socket event
                    io.to(`user:${volunteer.userId}`).emit('sos:new_request', {
                        sosId,
                        emergencyType: data.emergencyType,
                        priority: data.priority,
                        location: data.location,
                        distance: volunteer.distance,
                        createdAt: new Date()
                    });

                    // Send Push Notification
                    NotificationService.sendToUser(
                        volunteer.userId,
                        '🚨 Emergency Alert Nearby',
                        `New ${data.priority} ${data.emergencyType} SOS request at ${Math.round(volunteer.distance)}m away.`
                    );
                });

                logger.info('Volunteers notified', { sosId, count: volunteers.length });
            } catch (error: any) {
                logger.error('Notify volunteers error', { error: error.message });
            }
        });

        /**
         * SOS accepted event
         */
        socket.on('sos:accepted', async (data) => {
            try {
                const { sosId, userId, volunteerId } = data;

                // Notify user that volunteer accepted
                io.to(`user:${userId}`).emit('sos:volunteer_accepted', {
                    sosId,
                    volunteerId,
                    acceptedAt: new Date()
                });

                logger.info('SOS accepted notification sent', { sosId, volunteerId });
            } catch (error: any) {
                logger.error('SOS accepted error', { error: error.message });
            }
        });

        /**
         * SOS status update
         */
        socket.on('sos:status_update', async (data) => {
            try {
                const { sosId, status, userId, volunteerId } = data;

                // Notify both user and volunteer
                io.to(`user:${userId}`).emit('sos:status_changed', {
                    sosId,
                    status,
                    updatedAt: new Date()
                });

                if (volunteerId) {
                    io.to(`user:${volunteerId}`).emit('sos:status_changed', {
                        sosId,
                        status,
                        updatedAt: new Date()
                    });
                }

                logger.info('SOS status update sent', { sosId, status });
            } catch (error: any) {
                logger.error('SOS status update error', { error: error.message });
            }
        });

        // ============================================
        // CHAT EVENTS
        // ============================================

        /**
         * Join SOS chat room
         */
        socket.on('chat:join', async (data) => {
            try {
                const { sosId } = data;
                socket.join(`sos:${sosId}`);

                logger.info('User joined chat', { sosId, userId: socket.userId });
            } catch (error: any) {
                logger.error('Join chat error', { error: error.message });
            }
        });

        /**
         * Send chat message
         */
        socket.on('chat:message', async (data) => {
            try {
                const { sosId, content } = data;

                // Broadcast message to SOS room
                io.to(`sos:${sosId}`).emit('chat:new_message', {
                    sosId,
                    senderId: socket.userId,
                    content,
                    createdAt: new Date()
                });

                logger.info('Chat message sent', { sosId, userId: socket.userId });
            } catch (error: any) {
                logger.error('Chat message error', { error: error.message });
            }
        });

        /**
         * Leave SOS chat room
         */
        socket.on('chat:leave', async (data) => {
            try {
                const { sosId } = data;
                socket.leave(`sos:${sosId}`);

                logger.info('User left chat', { sosId, userId: socket.userId });
            } catch (error: any) {
                logger.error('Leave chat error', { error: error.message });
            }
        });

        // ============================================
        // LOCATION EVENTS
        // ============================================

        /**
         * Update volunteer location
         */
        socket.on('location:update', async (data) => {
            try {
                const { latitude, longitude, sosId } = data;

                // Broadcast location to SOS room if active
                if (sosId) {
                    io.to(`sos:${sosId}`).emit('location:volunteer_moved', {
                        volunteerId: socket.userId,
                        latitude,
                        longitude,
                        updatedAt: new Date()
                    });
                }

                // Persist to DB
                if (socket.userId) {
                    await query(
                        `INSERT INTO user_locations (user_id, location, updated_at)
                         VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), NOW())
                         ON CONFLICT (user_id) 
                         DO UPDATE SET location = EXCLUDED.location, updated_at = NOW()`,
                        [socket.userId, longitude, latitude]
                    );
                }

                logger.debug('Location updated', { userId: socket.userId, sosId });
            } catch (error: any) {
                logger.error('Location update error', { error: error.message });
            }
        });

        // ============================================
        // DISCONNECT
        // ============================================

        socket.on('disconnect', () => {
            logger.info('Client disconnected', {
                socketId: socket.id,
                userId: socket.userId
            });
        });

        // Error handler
        socket.on('error', (error) => {
            logger.error('Socket error', {
                error: error.message,
                userId: socket.userId
            });
        });
    });

    logger.info('Socket.io server initialized');

    return io;
}

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export default { initializeSocketIO, getIO };
