/**
 * Development Seed Data Script
 * 
 * Creates test users, volunteers, and sample data for development.
 */

const bcrypt = require('bcrypt');
const { pool } = require('../src/config/database');
const logger = require('../src/config/logger');
const config = require('../src/config/env');

/**
 * Seed development data
 */
async function seedData() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        logger.info('Seeding development data...');

        // Hash password for all test users
        const password = 'Password123!';
        const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

        // Create admin user
        const adminResult = await client.query(`
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id
    `, ['admin@careconnect.com', passwordHash, 'ADMIN']);

        const adminId = adminResult.rows[0].id;

        await client.query(`
      INSERT INTO user_profiles (user_id, name, phone, address)
      VALUES ($1, $2, $3, $4)
    `, [adminId, 'Admin User', '+1234567890', '123 Admin St, San Francisco, CA']);

        logger.info('✓ Created admin user');

        // Create test users
        const users = [
            { email: 'user1@test.com', name: 'John Doe', phone: '+1234567891', role: 'USER' },
            { email: 'user2@test.com', name: 'Jane Smith', phone: '+1234567892', role: 'USER' },
            { email: 'user3@test.com', name: 'Bob Johnson', phone: '+1234567893', role: 'USER' }
        ];

        for (const user of users) {
            const result = await client.query(`
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [user.email, passwordHash, user.role]);

            const userId = result.rows[0].id;

            await client.query(`
        INSERT INTO user_profiles (user_id, name, phone, address)
        VALUES ($1, $2, $3, $4)
      `, [userId, user.name, user.phone, '123 Main St, San Francisco, CA']);

            // Add location (San Francisco area)
            await client.query(`
        INSERT INTO user_locations (user_id, location, accuracy_meters)
        VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), 10)
      `, [userId, -122.4194 + (Math.random() - 0.5) * 0.1, 37.7749 + (Math.random() - 0.5) * 0.1]);
        }

        logger.info('✓ Created test users');

        // Create test volunteers
        const volunteers = [
            {
                email: 'volunteer1@test.com',
                name: 'Alice Volunteer',
                phone: '+1234567894',
                skills: ['FIRST_AID', 'CPR'],
                verified: true
            },
            {
                email: 'volunteer2@test.com',
                name: 'Charlie Helper',
                phone: '+1234567895',
                skills: ['FIRST_AID', 'SEARCH_RESCUE'],
                verified: true
            },
            {
                email: 'volunteer3@test.com',
                name: 'Diana Responder',
                phone: '+1234567896',
                skills: ['CPR', 'MEDICAL_PROFESSIONAL'],
                verified: false
            }
        ];

        for (const volunteer of volunteers) {
            const result = await client.query(`
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [volunteer.email, passwordHash, 'VOLUNTEER']);

            const userId = result.rows[0].id;

            await client.query(`
        INSERT INTO user_profiles (user_id, name, phone, address)
        VALUES ($1, $2, $3, $4)
      `, [userId, volunteer.name, volunteer.phone, '456 Helper Ave, San Francisco, CA']);

            await client.query(`
        INSERT INTO volunteers (user_id, skills, verified, available, verified_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, volunteer.skills, volunteer.verified, volunteer.verified, volunteer.verified ? adminId : null]);

            // Add location
            await client.query(`
        INSERT INTO user_locations (user_id, location, accuracy_meters)
        VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), 10)
      `, [userId, -122.4194 + (Math.random() - 0.5) * 0.1, 37.7749 + (Math.random() - 0.5) * 0.1]);
        }

        logger.info('✓ Created test volunteers');

        // Create test professional
        const professionalResult = await client.query(`
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id
    `, ['doctor@test.com', passwordHash, 'PROFESSIONAL']);

        const professionalId = professionalResult.rows[0].id;

        await client.query(`
      INSERT INTO user_profiles (user_id, name, phone, address)
      VALUES ($1, $2, $3, $4)
    `, [professionalId, 'Dr. Sarah Medical', '+1234567897', '789 Hospital Rd, San Francisco, CA']);

        await client.query(`
      INSERT INTO professionals (user_id, license_number, specialization, verified, available, verified_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [professionalId, 'MD123456', 'Emergency Medicine', true, true, adminId]);

        await client.query(`
      INSERT INTO user_locations (user_id, location, accuracy_meters)
      VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), 10)
    `, [professionalId, -122.4194, 37.7749]);

        logger.info('✓ Created test professional');

        await client.query('COMMIT');

        logger.info('✅ Development data seeded successfully!');
        logger.info('');
        logger.info('Test Credentials:');
        logger.info('  Admin:        admin@careconnect.com / Password123!');
        logger.info('  User:         user1@test.com / Password123!');
        logger.info('  Volunteer:    volunteer1@test.com / Password123!');
        logger.info('  Professional: doctor@test.com / Password123!');

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Seed data failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run seed
seedData().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
