/**
 * Init Migration Tracking
 * 
 * call this ONCE to seed the _migrations table with files that are already applied
 * to the current database.
 */

const { pool } = require('../src/config/database');
const logger = require('../src/config/logger');

const ALREADY_APPLIED = [
    '001_initial_schema.sql',
    '002_professional_features.sql',
    '003_remove_professionals.sql',
    '003_volunteer_location.sql',
    '004_add_sos_expiration.sql'
];

async function seedMigrations() {
    const client = await pool.connect();
    try {
        console.log('Seeding _migrations table...');

        // Ensure table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT NOW()
            );
        `);

        for (const file of ALREADY_APPLIED) {
            try {
                await client.query(
                    'INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                    [file]
                );
                console.log(`Marked verified: ${file}`);
            } catch (err) {
                console.error(`Failed to mark ${file}:`, err);
            }
        }

        console.log('Done.');

    } catch (error) {
        console.error('Script failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

seedMigrations();
