
const { Client } = require('pg');
const config = require('../src/config/env');

async function run() {
    console.log('Connecting to DB...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL || `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`,
    });

    try {
        await client.connect();
        console.log('Connected!');

        const emails = [
            'admin@careconnect.com',
            'user1@test.com',
            'user2@test.com',
            'user3@test.com',
            'volunteer1@test.com',
            'volunteer2@test.com',
            'volunteer3@test.com',
            'doctor@test.com'
        ];

        for (const email of emails) {
            console.log(`Cleaning data for ${email}...`);

            // Get user ID
            const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
            if (userRes.rows.length === 0) continue;

            const userId = userRes.rows[0].id;

            // Delete dependent data where CASCADE is missing
            await client.query('DELETE FROM chat_messages WHERE sender_id = $1', [userId]);
            await client.query('DELETE FROM sos_feedback WHERE volunteer_id = $1', [userId]);
            await client.query('DELETE FROM sos_rejections WHERE volunteer_id = $1', [userId]);
            await client.query('DELETE FROM sos_cancellations WHERE volunteer_id = $1', [userId]);

            // Update SOS requests accepted by this user (set to null? or delete?)
            // If they are test users, we likely want to delete the requests they accepted too?
            // But if they accepted a request from a REAL user, maybe we shouldn't delete the request?
            // "remove all the test data". Assuming test users only interacted with test data or we don't care.
            // But safe to set accepted_by = NULL? Or DELETE if they are the CREATOR.

            // Delete requests created by user
            await client.query('DELETE FROM sos_requests WHERE user_id = $1', [userId]);

            // Un-accept requests accepted by user (to allow user deletion)
            await client.query('UPDATE sos_requests SET accepted_by = NULL WHERE accepted_by = $1', [userId]);

            // Now delete user (Cascades handles profiles, locations, volunteers, professionals, tokens)
            const res = await client.query('DELETE FROM users WHERE id = $1', [userId]);
            console.log(`Deleted user ${email}`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
