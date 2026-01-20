/**
 * Run SOS Expiration Migration
 * Adds expiration columns to sos_requests table
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');
const logger = require('../src/config/logger');

async function runExpirationMigration() {
    const migrationFile = path.join(__dirname, '../migrations/004_add_sos_expiration.sql');

    try {
        logger.info('Running SOS expiration migration...');

        const sql = fs.readFileSync(migrationFile, 'utf8');

        await pool.query(sql);

        logger.info('✅ SOS expiration migration completed successfully!');

    } catch (error) {
        logger.error('❌ Migration failed', {
            error: error.message,
            detail: error.detail
        });
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runExpirationMigration();
