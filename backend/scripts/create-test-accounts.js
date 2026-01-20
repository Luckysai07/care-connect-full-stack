/**
 * Create Test Accounts Script
 * Run this to create test accounts for all roles
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');
const logger = require('../src/config/logger');

async function createTestAccounts() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Hash password
        const password = await bcrypt.hash('Password123!', 10);

        // Create test users
        const users = [
            { email: 'user@careconnect.com', name: 'Test User', phone: '+1234567890', role: 'USER' },
            { email: 'volunteer@careconnect.com', name: 'Test Volunteer', phone: '+1234567891', role: 'VOLUNTEER' },
            { email: 'professional@careconnect.com', name: 'Test Professional', phone: '+1234567892', role: 'PROFESSIONAL' }
        ];

        for (const user of users) {
            // Insert user
            const userResult = await client.query(
                `INSERT INTO users (email, password, name, phone, role, email_verified)
                 VALUES ($1, $2, $3, $4, $5, true)
                 ON CONFLICT (email) DO UPDATE SET password = $2, role = $5
                 RETURNING id`,
                [user.email, password, user.name, user.phone, user.role]
            );

            const userId = userResult.rows[0].id;
            logger.info(`Created/Updated user: ${user.email}`);

            // Create user profile
            await client.query(
                `INSERT INTO user_profiles (user_id, phone, address, emergency_contact_name, emergency_contact_phone)
                 VALUES ($1, $2, '123 Test St', 'Emergency Contact', '+1234567899')
                 ON CONFLICT (user_id) DO NOTHING`,
                [userId, user.phone]
            );

            // Create role-specific records
            if (user.role === 'VOLUNTEER') {
                await client.query(
                    `INSERT INTO volunteers (user_id, skills, certifications, verified, available, average_rating)
                     VALUES ($1, 'First Aid, CPR, Emergency Response', '["CPR Certified", "First Aid"]', true, true, 4.5)
                     ON CONFLICT (user_id) DO UPDATE SET verified = true, available = true`,
                    [userId]
                );
                logger.info('Created volunteer record');
            } else if (user.role === 'PROFESSIONAL') {
                await client.query(
                    `INSERT INTO professionals (user_id, specialization, license_number, verified, available)
                     VALUES ($1, 'Emergency Medicine', 'MED-12345', true, true)
                     ON CONFLICT (user_id) DO UPDATE SET verified = true, available = true`,
                    [userId]
                );
                logger.info('Created professional record');
            }
        }

        await client.query('COMMIT');
        logger.info('✅ All test accounts created successfully!');
        logger.info('Test credentials:');
        logger.info('  User: user@careconnect.com / Password123!');
        logger.info('  Volunteer: volunteer@careconnect.com / Password123!');
        logger.info('  Professional: professional@careconnect.com / Password123!');

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Failed to create test accounts', { error: error.message });
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createTestAccounts();
