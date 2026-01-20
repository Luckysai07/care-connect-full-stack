/**
 * Database Migration Script
 * 
 * Runs SQL migration files in order.
 * Tracks applied migrations in _migrations table to ensure idempotency.
 */

import fs from 'fs';
import path from 'path';
import { pool } from '../config/database.js';
import logger from '../config/logger.js';
import { fileURLToPath } from 'url';

// ESM replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run all migration files
 */
async function runMigrations() {
    // Migrations are in 'migrations' folder at project root
    // We assume CWD is project root, or we navigate up from here.
    // src/scripts/migrate.ts -> dist/scripts/migrate.js
    // We want to access ../../migrations from this file's directory? 
    // Or just use process.cwd() + 'migrations'

    // Using process.cwd() is safer in Docker where WORKDIR is set
    const migrationsDir = path.join(process.cwd(), 'migrations');

    const client = await pool.connect();

    try {
        // 1. Create migrations tracking table if not exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 2. Get executed migrations
        const existingMigrationsResult = await client.query('SELECT name FROM _migrations');
        const executedMigrations = new Set(existingMigrationsResult.rows.map((row: any) => row.name));

        // 3. Get all .sql files and sort them
        if (!fs.existsSync(migrationsDir)) {
            logger.warn(`Migrations directory not found at: ${migrationsDir}`);
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        if (files.length === 0) {
            logger.warn('No migration files found');
            return;
        }

        logger.info(`Found ${files.length} migration file(s)`);

        // 4. Run pending migrations
        for (const file of files) {
            if (executedMigrations.has(file)) {
                logger.debug(`Skipping already applied migration: ${file}`);
                continue;
            }

            logger.info(`Running migration: ${file}`);

            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                await client.query('COMMIT');
                logger.info(`✓ ${file} completed successfully`);
            } catch (error: any) {
                await client.query('ROLLBACK');
                logger.error(`✗ ${file} failed`, {
                    error: error.message,
                    detail: error.detail || ''
                });
                throw error;
            }
        }

        logger.info('All migrations checked and applied successfully!');

    } catch (error: any) {
        logger.error('Migration failed', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migrations
runMigrations();
