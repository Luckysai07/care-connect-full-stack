/**
 * Cleanup Test Data Script
 * 
 * Removes all test users and related data created by the seed script.
 * Usage: node scripts/cleanup-test-data.js
 */

const { pool } = require('../src/config/database');
const logger = require('../src/config/logger');

const TEST_EMAILS = [
    'admin@careconnect.com',
    'user1@test.com',
    'user2@test.com',
    'user3@test.com',
    'volunteer1@test.com',
    'volunteer2@test.com',
    'volunteer3@test.com',
    'doctor@test.com'
];

async function cleanupData() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        logger.info('Cleaning up test data...');

        // Delete users (Cascading should handle profiles, volunteers, professionals, locations)
        // If dependent tables don't cascade, we might need manual deletes, but let's try cascading first.
        // Assuming standard Foreign Key with ON DELETE CASCADE or manual cleanup if needed.

        // Actually, to be safe and thorough against potential constraint errors if CASCADE is missing:
        // We will try deleting from child tables first for these users, then the users themselves.

        // 1. Get IDs of test users (matching specific emails or patterns)
        const userResult = await client.query(
            `SELECT id, email FROM users WHERE 
             email = ANY($1) OR 
             email LIKE 'browser.test.%' OR 
             email LIKE 'error.test.%' OR 
             email LIKE 'test%@example.com' OR
             email = 'admin@careconnect.com'`,
            [TEST_EMAILS]
        );

        const userIds = userResult.rows.map(r => r.id);

        if (userIds.length === 0) {
            logger.info('No test users found to clean up.');
            await client.query('COMMIT');
            return;
        }

        logger.info(`Found ${userIds.length} test users. Removing...`);

        // 2. Delete users (Cascading should handle profiles, volunteers, professionals, locations)
        // Using explicit deletes for safety against foreign key constraints if cascades are missing
        // Note: We use WHERE user_id IN (...) syntax which node-postgres handles if we pass simple array? 
        // No, node-postgres doesn't auto-expand IN list. converting to ANY or multiple params.
        // Let's rely on CASCADE which was in the schema.

        for (const userId of userIds) {
            // Deleting dependent data specifically just in case
            await client.query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM user_locations WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM volunteers WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM professionals WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM sos_requests WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM users WHERE id = $1', [userId]);
        }

        await client.query('COMMIT');

        logger.info('✅ Test data cleanup successful!');
        logger.info(`Removed users: ${userResult.rows.map(u => u.email).join(', ')}`);

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Cleanup failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run cleanup
cleanupData().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
