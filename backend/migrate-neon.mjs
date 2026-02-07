/**
 * Quick Migration Script for Neon Database
 * Runs all SQL migrations with proper SSL configuration
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Bbx0KDO4UZXe@ep-red-heart-ah0gu4gq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigrations() {
    console.log('[INFO] Starting database migrations...');

    const migrationsDir = path.join(process.cwd(), 'migrations');
    const client = await pool.connect();

    try {
        // Create migrations tracking table
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Get existing migrations
        const result = await client.query('SELECT name FROM _migrations');
        const executedMigrations = new Set(result.rows.map((row) => row.name));

        // Get all SQL files
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`[INFO] Found ${files.length} migration files`);

        // Run each migration
        for (const file of files) {
            if (executedMigrations.has(file)) {
                console.log(`[SKIP] ${file} (already applied)`);
                continue;
            }

            console.log(`[RUN] ${file}...`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                await client.query('COMMIT');
                console.log(`[✓] ${file} completed`);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error(`[✗] ${file} failed:`, error.message);
                throw error;
            }
        }

        console.log('\n✅ All migrations completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
