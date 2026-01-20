/**
 * Redis Configuration
 */
import { createClient } from 'redis';
import config from './env.js';
import logger from './logger.js';

const redisClient = createClient({
    url: config.redis.url || `redis://${config.redis.host}:${config.redis.port}`,
    password: config.redis.password
});

redisClient.on('error', (err) => {
    if (config.isDevelopment() && (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED'))) {
        // Suppress connection refused logs in dev
        return;
    }
    logger.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
});

// Connect explicitly
export const connectRedis = async () => {
    if (config.isTest()) return;
    try {
        await redisClient.connect();
    } catch (err: any) {
        // Log warning but don't crash in dev
        if (config.isProduction()) {
            logger.error('Failed to connect to Redis', { error: err.message });
            throw err;
        } else {
            logger.warn('Redis connection failed - functionality may be limited', { error: err.message });
        }
    }
};

export default redisClient;
