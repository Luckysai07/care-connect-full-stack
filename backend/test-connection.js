/**
 * Test PostgreSQL Connection
 * Run this to verify your database connection works
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
});

async function testConnection() {
    try {
        console.log('Testing connection to:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

        const client = await pool.connect();
        console.log('✅ Connected successfully!');

        const result = await client.query('SELECT version()');
        console.log('PostgreSQL version:', result.rows[0].version);

        // Check if database exists
        const dbCheck = await client.query(
            "SELECT datname FROM pg_database WHERE datname = 'careconnect'"
        );

        if (dbCheck.rows.length > 0) {
            console.log('✅ Database "careconnect" exists');
        } else {
            console.log('❌ Database "careconnect" does NOT exist');
            console.log('\nPlease create it first:');
            console.log('1. Open pgAdmin or SQL Shell');
            console.log('2. Run: CREATE DATABASE careconnect;');
        }

        client.release();
        await pool.end();

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('\nPossible issues:');
        console.error('1. Wrong password in DATABASE_URL');
        console.error('2. PostgreSQL not running');
        console.error('3. Wrong port (should be 5432)');
        console.error('4. Database "careconnect" does not exist');
        process.exit(1);
    }
}

testConnection();
