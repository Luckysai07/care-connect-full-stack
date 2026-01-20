/**
 * Verify Volunteer Account
 * Sets volunteer as verified and available
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'careconnect',
    user: 'postgres',
    password: 'Sai@9010'
});

async function verifyVolunteer() {
    try {
        console.log('Verifying volunteer account...');

        // Update volunteer to be verified and available
        const result = await pool.query(`
            UPDATE volunteers 
            SET verified = true, 
                verified_at = NOW(), 
                available = true
            WHERE user_id = (
                SELECT id FROM users 
                WHERE email = 'volunteer@careconnect.com'
            )
            RETURNING user_id
        `);

        if (result.rowCount > 0) {
            console.log('✅ Volunteer verified and set to available!');
            console.log('The volunteer can now see SOS requests.');
        } else {
            console.log('❌ Volunteer not found. Make sure the account exists.');
        }

        // Check current status
        const status = await pool.query(`
            SELECT u.email, v.verified, v.available 
            FROM users u 
            JOIN volunteers v ON u.id = v.user_id 
            WHERE u.email = 'volunteer@careconnect.com'
        `);

        if (status.rows.length > 0) {
            console.log('\nCurrent Status:');
            console.log(`  Email: ${status.rows[0].email}`);
            console.log(`  Verified: ${status.rows[0].verified}`);
            console.log(`  Available: ${status.rows[0].available}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

verifyVolunteer();
