/**
 * Run Professional Removal Migration
 * Runs only the 003_remove_professionals.sql migration
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');
const logger = require('../src/config/logger');

async function runProfessionalRemovalMigration() {
    const migrationFile = path.join(__dirname, '../migrations/003_remove_professionals.sql');

    try {
        logger.info('Running professional removal migration...');

        const sql = fs.readFileSync(migrationFile, 'utf8');

        await pool.query(sql);

        logger.info('✅ Professional removal migration completed successfully!');
        logger.info('Professional role has been removed and merged into volunteers');

    } catch (error) {
        logger.error('❌ Migration failed', {
            error: error.message,
            detail: error.detail
        });

        if (error.message.includes('already exists')) {
            logger.warn('Migration may have already been run. Checking database...');

            // Check if migration was successful
            const result = await pool.query(`
                SELECT COUNT(*) as count FROM users WHERE role = 'PROFESSIONAL'
            `);

            if (result.rows[0].count === '0') {
                logger.info('✅ No professional users found - migration appears complete');
            } else {
                logger.error(`Found ${result.rows[0].count} professional users - migration incomplete`);
            }
        }

        process.exit(1);
    } finally {
        await pool.end();
    }
}

runProfessionalRemovalMigration();
