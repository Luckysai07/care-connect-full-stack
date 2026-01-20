/**
 * Check Volunteer Status
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'careconnect',
    user: 'postgres',
    password: 'Sai@9010'
});

async function checkStatus() {
    try {
        console.log('Checking volunteer status...\n');

        // Check all volunteers
        const volunteers = await pool.query(`
            SELECT u.email, u.role, v.verified, v.available, v.skills
            FROM users u 
            LEFT JOIN volunteers v ON u.id = v.user_id 
            WHERE u.role = 'VOLUNTEER'
        `);

        if (volunteers.rows.length === 0) {
            console.log('❌ No volunteer accounts found!');
            console.log('\nCreating volunteer account...');

            // Create volunteer
            await pool.query(`
                INSERT INTO users (email, password_hash, role, is_active)
                VALUES ('volunteer@careconnect.com', '$2b$10$abcdefghijklmnopqrstuv', 'VOLUNTEER', true)
                ON CONFLICT (email) DO NOTHING
            `);

            await pool.query(`
                INSERT INTO volunteers (user_id, skills, verified, available)
                SELECT id, ARRAY['First Aid', 'CPR'], true, true 
                FROM users WHERE email = 'volunteer@careconnect.com'
                ON CONFLICT (user_id) DO UPDATE SET verified = true, available = true
            `);

            console.log('✅ Volunteer account created and verified!');
        } else {
            console.log('Volunteer Accounts:');
            volunteers.rows.forEach(v => {
                console.log(`  Email: ${v.email}`);
                console.log(`  Role: ${v.role}`);
                console.log(`  Verified: ${v.verified || 'NO VOLUNTEER RECORD'}`);
                console.log(`  Available: ${v.available || 'NO VOLUNTEER RECORD'}`);
                console.log(`  Skills: ${v.skills || 'NONE'}`);
                console.log('---');
            });

            // Fix any unverified volunteers
            const fixed = await pool.query(`
                UPDATE volunteers 
                SET verified = true, available = true, verified_at = NOW()
                WHERE verified = false OR available = false
                RETURNING user_id
            `);

            if (fixed.rowCount > 0) {
                console.log(`\n✅ Fixed ${fixed.rowCount} volunteer(s) - set to verified and available`);
            }
        }

        // Check for pending SOS
        const sos = await pool.query(`
            SELECT COUNT(*) as count FROM sos_requests WHERE status = 'PENDING'
        `);

        console.log(`\n📊 Pending SOS Requests: ${sos.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkStatus();
