require('dotenv').config();
const { Pool } = require('pg');

// Force connection to 'postgres' db which always exists
const connectionString = process.env.DATABASE_URL.replace(/\/[^/]+$/, '/postgres');

const pool = new Pool({
    connectionString: connectionString,
    connectionTimeoutMillis: 5000,
});

async function test() {
    try {
        console.log('Attempting to connect with configured password...');
        const client = await pool.connect();
        console.log('SUCCESS: Password is correct!');
        client.release();
    } catch (err) {
        console.log('FAILURE: ' + err.message);
    } finally {
        await pool.end();
    }
}
test();
