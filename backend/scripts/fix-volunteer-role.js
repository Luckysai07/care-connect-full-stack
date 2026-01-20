/**
 * Fix Volunteer Role
 * Updates the volunteer user to have VOLUNTEER role
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'careconnect',
    user: 'postgres',
    password: 'Sai@9010'
});

async function fixVolunteerRole() {
    try {
        console.log('Fixing volunteer role...\n');

        // Check current role
        const current = await pool.query(`
            SELECT u.email, u.role, v.verified, v.available
            FROM users u
            LEFT JOIN volunteers v ON u.id = v.user_id
            WHERE u.email = 'volunteer@careconnect.com'
        `);

        if (current.rows.length === 0) {
            console.log('❌ Volunteer user not found!');
            return;
        }

        console.log('Current state:');
        console.log(`  Email: ${current.rows[0].email}`);
        console.log(`  Role: ${current.rows[0].role}`);
        console.log(`  Verified: ${current.rows[0].verified}`);
        console.log(`  Available: ${current.rows[0].available}`);

        // Update role to VOLUNTEER
        await pool.query(`
            UPDATE users 
            SET role = 'VOLUNTEER'
            WHERE email = 'volunteer@careconnect.com'
        `);

        // Ensure volunteer record exists
        await pool.query(`
            INSERT INTO volunteers (user_id, skills, verified, available, verified_at)
            SELECT id, ARRAY['First Aid', 'CPR', 'Emergency Response'], true, true, NOW()
            FROM users WHERE email = 'volunteer@careconnect.com'
            ON CONFLICT (user_id) DO UPDATE 
            SET verified = true, available = true, verified_at = NOW()
        `);

        console.log('\n✅ Fixed!');
        console.log('  Role updated to: VOLUNTEER');
        console.log('  Verified: true');
        console.log('  Available: true');
        console.log('\n🔄 Please logout and login again for changes to take effect!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

fixVolunteerRole();
