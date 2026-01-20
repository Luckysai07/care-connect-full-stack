/**
 * Promote User to Admin Script
 * Usage: node scripts/promote-admin.js <email>
 */

const { pool } = require('../src/config/database');
require('dotenv').config();

const email = process.argv[2];

if (!email) {
    console.error('❌ Please provide an email address.');
    console.log('Usage: node scripts/promote-admin.js <email>');
    process.exit(1);
}

async function promoteUser() {
    try {
        console.log(`🔍 Finding user with email: ${email}...`);

        const result = await pool.query(
            `UPDATE users 
             SET role = 'ADMIN', updated_at = NOW() 
             WHERE email = $1 
             RETURNING id, email, role`,
            [email]
        );

        if (result.rows.length === 0) {
            console.error('❌ User not found!');
        } else {
            console.log('✅ Success! User promoted to ADMIN.');
            console.table(result.rows[0]);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

promoteUser();
