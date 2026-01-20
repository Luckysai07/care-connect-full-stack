
const { Client } = require('pg');
const config = require('../src/config/env');

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`,
    });

    try {
        await client.connect();
        const res = await client.query('SELECT count(*) FROM users');
        console.log(`Total Users: ${res.rows[0].count}`);

        if (res.rows[0].count > 0) {
            const users = await client.query('SELECT email, role FROM users LIMIT 5');
            console.log('Existing users:', users.rows);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
