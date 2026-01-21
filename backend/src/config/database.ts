/**
 * Database Configuration Module
 * 
 * Sets up PostgreSQL connection pool with proper error handling.
 * Uses environment variables for all configuration.
 */

import pg, { PoolClient } from 'pg';
const { Pool } = pg;
import config from './env.js';
import logger from './logger.js';

/**
 * PostgreSQL connection pool
 * Manages database connections efficiently
 */
const pool = new Pool({
    connectionString: config.database.url,
    max: config.database.maxConnections,
    idleTimeoutMillis: config.database.idleTimeoutMillis,
    connectionTimeoutMillis: config.database.connectionTimeoutMillis,
    // Use SSL in production
    // ssl: config.isProduction() ? { rejectUnauthorized: false } : false
    ssl: false // Disabled for local Docker deployment connecting to host DB
});

/**
 * Handle pool errors
 * Prevents app crash on unexpected database errors
 */
pool.on('error', (err: Error) => {
    logger.error('Unexpected database error', {
        error: err.message,
        stack: err.stack
    });
});

/**
 * Handle pool connection events
 */
pool.on('connect', () => {
    logger.debug('New database connection established');
});

pool.on('remove', () => {
    logger.debug('Database connection removed from pool');
});

/**
 * Test database connection
 * @returns True if connection successful
 */
export async function testConnection(): Promise<boolean> {
    try {
        const result = await pool.query('SELECT NOW() as now, version() as version');
        const row = result.rows[0];
        logger.info('Database connection successful', {
            timestamp: row.now,
            version: row.version.split(' ')[0] + ' ' + row.version.split(' ')[1]
        });
        return true;
    } catch (error: any) {
        logger.error('Database connection failed', {
            error: error.message,
            stack: error.stack
        });
        return false;
    }
}

/**
 * Execute a query with automatic error logging
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Query result
 */
export async function query(text: string, params?: any[]) {
    const start = Date.now();

    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        // Log slow queries (> 1 second)
        if (duration > 1000) {
            logger.warn('Slow query detected', {
                duration: `${duration}ms`,
                query: text.substring(0, 100) + '...',
                rowCount: result.rowCount
            });
        }

        return result;
    } catch (error: any) {
        logger.error('Database query error', {
            error: error.message,
            query: text.substring(0, 100) + '...',
            params: params
        });
        throw error;
    }
}

/**
 * Get a client from the pool for transactions
 * Remember to release the client after use!
 * @returns Database client
 */
export async function getClient() {
    try {
        const client = await pool.connect();
        const query = client.query;
        const release = client.release;

        // set a timeout of 5 seconds, after which we will log this client's last query
        const timeout = setTimeout(() => {
            logger.error('A client has been checked out for more than 5 seconds!');
            logger.error(`The last executed query on this client was: ${(client as any).lastQuery}`);
        }, 5000);

        // monkey patch the query method to keep track of the last query executed
        (client as any).query = (...args: any[]) => {
            (client as any).lastQuery = args;
            return query.apply(client, args as any);
        };

        (client as any).release = () => {
            // clear our timeout
            clearTimeout(timeout);
            // set the methods back to their old un-monkey-patched version
            (client as any).query = query;
            (client as any).release = release;
            return release.apply(client);
        };

        return client as PoolClient & { lastQuery?: any[] };
    } catch (error: any) {
        logger.error('Failed to get database client', {
            error: error.message
        });
        throw error;
    }
}

export async function closePool() {
    try {
        await pool.end();
        logger.info('Database pool closed successfully');
    } catch (error: any) {
        logger.error('Error closing database pool', {
            error: error.message
        });
    }
}

export { pool };

/**
 * Default export object to mimic CommonJS behavior for easier migration,
 * but named exports are preferred in new code.
 */
export default {
    pool,
    query,
    getClient,
    testConnection,
    closePool
};
