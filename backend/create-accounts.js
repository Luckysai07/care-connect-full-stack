/**
 * Quick script to create test accounts
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'careconnect',
    user: 'postgres',
    password: 'Sai@9010'
});

async function createAccounts() {
    const client = await pool.connect();

    try {
        console.log('Creating test accounts...');

        const password = await bcrypt.hash('Password123!', 10);

        // Create users (removed PROFESSIONAL)
        await client.query(`
            INSERT INTO users (email, password_hash, role, is_active) VALUES
            ('user@careconnect.com', $1, 'USER', true),
            ('volunteer@careconnect.com', $1, 'VOLUNTEER', true)
            ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = EXCLUDED.role
        `, [password]);

        console.log('✅ Users created');

        // Create user profiles
        const userIds = await client.query(`SELECT id, email FROM users WHERE email IN ('user@careconnect.com', 'volunteer@careconnect.com')`);

        for (const user of userIds.rows) {
            const phone = user.email === 'user@careconnect.com' ? '+1234567890' : '+1234567891';
            const name = user.email === 'user@careconnect.com' ? 'Test User' : 'Test Volunteer';

            await client.query(`
                INSERT INTO user_profiles (user_id, name, phone)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id) DO UPDATE SET name = $2, phone = $3
            `, [user.id, name, phone]);
        }

        console.log('✅ User profiles created');

        // Create volunteer with professional fields
        await client.query(`
            INSERT INTO volunteers (user_id, skills, verified, available, license_number, specialization, hospital_affiliation)
            SELECT id, ARRAY['First Aid', 'CPR', 'Emergency Response'], true, true, 'MED-12345', 'Emergency Medicine', 'City General Hospital' 
            FROM users WHERE email = 'volunteer@careconnect.com'
            ON CONFLICT (user_id) DO UPDATE SET 
                verified = true, 
                available = true,
                license_number = 'MED-12345',
                specialization = 'Emergency Medicine',
                hospital_affiliation = 'City General Hospital'
        `);

        console.log('✅ Volunteer record created (with professional credentials)');
        console.log('\n🎉 All test accounts created successfully!');
        console.log('\nTest Credentials:');
        console.log('  User: user@careconnect.com / Password123!');
        console.log('  Volunteer (with medical license): volunteer@careconnect.com / Password123!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

createAccounts();
