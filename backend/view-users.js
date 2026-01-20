/**
 * View Users Script
 * 
 * connect to the database and list all registered users
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function viewUsers() {
    try {
        console.log('🔍 Fetching users from database...\n');

        const res = await pool.query(`
            SELECT id, email, role, is_active, created_at, last_login_at 
            FROM users 
            ORDER BY created_at DESC
        `);

        if (res.rows.length === 0) {
            console.log('No users found.');
        } else {
            console.table(res.rows);
            console.log(`\nTotal Users: ${res.rows.length}`);
        }

    } catch (err) {
        console.error('Error fetching users:', err.message);
    } finally {
        await pool.end();
    }
}

viewUsers();
