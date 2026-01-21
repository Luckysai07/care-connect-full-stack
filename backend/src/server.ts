/**
 * CareConnect Backend Server
 * 
 * Main Express application setup.
 * Configures middleware, routes, and Socket.io.
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';

import config from './config/env.js';
import logger from './config/logger.js';
import { testConnection as testDbConnection, closePool } from './config/database.js';
import { connectRedis } from './config/redis.js';

import requestLogger from './middleware/request-logger.js';
import { apiLimiter } from './middleware/rate-limit.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

// Import Routes
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import sosRoutes from './modules/sos/sos.routes.js';
import volunteersRoutes from './modules/volunteers/volunteers.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

// Import Socket.io
import { initializeSocketIO } from './sockets/socket.js';

// Import background jobs
import { startExpirationJob } from './jobs/sos-expiration.job.js';

// Import Swagger Specs
// Note: specs might still be JS, so we might need createRequire or just ignore types for now if it's a huge js file.
// Assuming we kept swagger.js as JS for now or it wasn't mentioned. 
// If it's JS, we can use a compliant import if it has module.exports.
// If it's CJS, we still need createRequire just for that, OR we accept it's legacy.
// Let's check if we can migrate swagger.js or just keep one createRequire.
// View task list: swagger was not in the list. I'll keep createRequire ONLY for swagger if needed, 
// or I can check if I can generic import it. 
// Actually, `import specs from './config/swagger.js'` might fail if it's CJS.
// Let's use createRequire for the few remaining JS files if any. 
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const specs = require('./config/swagger.js');

// Create Express app
const app: Express = express();
const httpServer = createServer(app);

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security headers
app.use(helmet());

// Compression
app.use(compression());

// CORS configuration
app.use(cors({
    origin: config.server.allowedOrigins,
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api', apiLimiter);

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
    try {
        const dbHealthy = await testDbConnection();

        const health = {
            status: dbHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config.server.env,
            checks: {
                database: dbHealthy ? 'healthy' : 'unhealthy'
            }
        };

        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
    } catch (error: any) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Swagger Documentation
if (config.isDevelopment()) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    logger.info(`📄 API Documentation available at http://localhost:${config.server.port}/api-docs`);
}

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

/**
 * Start server with database retry logic
 */
async function startServer() {
    const MAX_RETRIES = 5;
    let retryCount = 0;

    logger.info('Starting Server...', {
        env: config.server.env,
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: config.database.url ? 'Set (Hidden)' : 'Not Set',
        logLevel: config.logging.level
    });

    while (retryCount < MAX_RETRIES) {
        try {
            // Test database connection
            const dbConnected = await testDbConnection();
            if (!dbConnected) {
                throw new Error('Database connection failed');
            }

            // Initialize Socket.IO
            initializeSocketIO(httpServer);

            // Connect to Redis (non-blocking in dev)
            // Connect to Redis (non-blocking in dev)
            connectRedis();

            // Start HTTP server
            httpServer.listen(config.server.port, () => {
                logger.info('🚀 CareConnect Server Started', {
                    port: config.server.port,
                    environment: config.server.env,
                    nodeVersion: process.version
                });

                logger.info('📊 Server Information', {
                    apiUrl: `http://localhost:${config.server.port}/api`,
                    healthCheck: `http://localhost:${config.server.port}/health`,
                    frontendUrl: config.server.frontendUrl
                });

                // Start background jobs
                startExpirationJob();
            });

            return; // Success, exit loop

        } catch (error: any) {
            retryCount++;
            logger.warn(`Database connection attempt ${retryCount}/${MAX_RETRIES} failed. Retrying...`, {
                error: error.message
            });

            if (retryCount === MAX_RETRIES) {
                logger.error('Failed to start server after multiple attempts', {
                    error: error.message,
                    stack: error.stack
                });
                process.exit(1);
            }

            // Wait before retrying (exponential backoff: 2s, 4s, 8s...)
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string) {
    logger.info(`${signal} received, shutting down gracefully...`);

    // Stop accepting new connections
    httpServer.close(async () => {
        logger.info('HTTP server closed');

        try {
            // Close database connections
            await closePool();

            logger.info('All connections closed successfully');
            process.exit(0);
        } catch (error: any) {
            logger.error('Error during shutdown', {
                error: error.message
            });
            process.exit(1);
        }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
    });
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection', {
        reason,
        promise
    });
});

// Start the server only if direct execution (es-main check not easily available in TS without lib, env check is safer)
// Check if NOT running in test environment
if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export { app, httpServer };
export default app;
