/**
 * Environment Configuration Module
 * 
 * Centralizes all environment variable access with validation.
 * Ensures all required variables are present before app starts.
 */

import dotenv from 'dotenv';
dotenv.config();

/**
 * Validates that required environment variables are set
 * @param requiredVars - Array of required variable names
 * @throws {Error} If any required variable is missing
 */
function validateEnv(requiredVars: string[]): void {
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check your .env file and ensure all required variables are set.'
        );
    }
}

// Validate critical environment variables
const requiredVars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET'
];

validateEnv(requiredVars);

/**
 * Environment configuration object
 * All environment variables are accessed through this object
 */
const config = {
    // Server configuration
    server: {
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3000', 10),
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')
    },

    // Database configuration
    database: {
        url: process.env.DATABASE_URL as string,
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        name: process.env.DATABASE_NAME || 'careconnect',
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD,
        maxConnections: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    },

    // Redis configuration
    redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined
    },

    // JWT configuration
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET as string,
        refreshSecret: process.env.JWT_REFRESH_SECRET as string,
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
    },

    // Security configuration
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        sosRateLimitMax: parseInt(process.env.SOS_RATE_LIMIT_MAX || '3', 10),
        sosRateLimitWindowMs: parseInt(process.env.SOS_RATE_LIMIT_WINDOW_MS || '3600000', 10)
    },

    // External APIs (Optional)
    external: {
        firebaseServerKey: process.env.FIREBASE_SERVER_KEY,
        firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER
    },

    // AWS S3 configuration
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        s3Bucket: process.env.AWS_S3_BUCKET || 'careconnect-uploads',
        region: process.env.AWS_REGION || 'us-east-1'
    },

    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        filePath: process.env.LOG_FILE_PATH || 'logs/app.log'
    },

    // Geo-spatial configuration
    geo: {
        searchRadiusSteps: [
            parseInt(process.env.GEO_SEARCH_RADIUS_STEP_1 || '1000', 10),
            parseInt(process.env.GEO_SEARCH_RADIUS_STEP_2 || '3000', 10),
            parseInt(process.env.GEO_SEARCH_RADIUS_STEP_3 || '5000', 10),
            parseInt(process.env.GEO_SEARCH_RADIUS_STEP_4 || '10000', 10)
        ],
        maxVolunteersToNotify: parseInt(process.env.MAX_VOLUNTEERS_TO_NOTIFY || '10', 10)
    },

    // SOS configuration
    sos: {
        escalationTimeoutMs: parseInt(process.env.SOS_ESCALATION_TIMEOUT_MS || '120000', 10),
        locationUpdateIntervalMs: parseInt(process.env.LOCATION_UPDATE_INTERVAL_MS || '5000', 10)
    },

    // Helpers
    isProduction: () => (process.env.NODE_ENV || 'development') === 'production',
    isDevelopment: () => (process.env.NODE_ENV || 'development') === 'development',
    isTest: () => (process.env.NODE_ENV || 'development') === 'test'
};

export default config;
