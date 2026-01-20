/**
 * Debug Volunteer SOS Visibility
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'careconnect',
    user: 'postgres',
    password: 'Sai@9010'
});

async function debugVolunteerSOS() {
    try {
        console.log('=== DEBUGGING VOLUNTEER SOS VISIBILITY ===\n');

        // 1. Check volunteer account
        console.log('1. Checking volunteer account...');
        const volunteer = await pool.query(`
            SELECT u.id, u.email, u.role, v.verified, v.available, v.skills
            FROM users u 
            LEFT JOIN volunteers v ON u.id = v.user_id 
            WHERE u.email = 'volunteer@careconnect.com'
        `);

        if (volunteer.rows.length === 0) {
            console.log('❌ PROBLEM: Volunteer account does not exist!');
            return;
        }

        const vol = volunteer.rows[0];
        console.log(`   Email: ${vol.email}`);
        console.log(`   User ID: ${vol.id}`);
        console.log(`   Role: ${vol.role}`);
        console.log(`   Verified: ${vol.verified}`);
        console.log(`   Available: ${vol.available}`);
        console.log(`   Skills: ${vol.skills}`);

        if (!vol.verified) {
            console.log('❌ PROBLEM: Volunteer is NOT verified!');
        }
        if (!vol.available) {
            console.log('❌ PROBLEM: Volunteer is NOT available!');
        }

        // 2. Check pending SOS requests
        console.log('\n2. Checking pending SOS requests...');
        const pendingSOS = await pool.query(`
            SELECT id, emergency_type, status, created_at
            FROM sos_requests 
            WHERE status = 'PENDING'
            ORDER BY created_at DESC
            LIMIT 5
        `);

        console.log(`   Total pending SOS: ${pendingSOS.rows.length}`);
        if (pendingSOS.rows.length > 0) {
            console.log('   Recent SOS requests:');
            pendingSOS.rows.forEach(sos => {
                console.log(`     - ID: ${sos.id}, Type: ${sos.emergency_type}, Status: ${sos.status}`);
            });
        } else {
            console.log('   ❌ PROBLEM: No pending SOS requests found!');
        }

        // 3. Check rejections
        console.log('\n3. Checking if volunteer rejected any SOS...');
        const rejections = await pool.query(`
            SELECT sos_id FROM sos_rejections WHERE volunteer_id = $1
        `, [vol.id]);

        console.log(`   Rejected SOS count: ${rejections.rows.length}`);
        if (rejections.rows.length > 0) {
            console.log('   Rejected SOS IDs:', rejections.rows.map(r => r.sos_id));
        }

        // 4. Simulate the getIncomingSOS query
        console.log('\n4. Simulating getIncomingSOS query...');
        const incomingSOS = await pool.query(`
            SELECT s.id, s.emergency_type, s.description, s.created_at, s.priority,
                    ST_Y(s.location::geometry) as latitude,
                    ST_X(s.location::geometry) as longitude,
                    u.id as user_id,
                    up.name as user_name, up.phone as user_phone
             FROM sos_requests s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN user_profiles up ON s.user_id = up.user_id
             WHERE s.status = 'PENDING'
             AND s.id NOT IN (
                 SELECT sos_id FROM sos_rejections WHERE volunteer_id = $1
             )
             ORDER BY s.created_at DESC
             LIMIT 20
        `, [vol.id]);

        console.log(`   Query returned: ${incomingSOS.rows.length} SOS requests`);

        if (incomingSOS.rows.length > 0) {
            console.log('   ✅ SOS requests SHOULD be visible!');
            console.log('   Sample SOS:');
            const sample = incomingSOS.rows[0];
            console.log(`     - ID: ${sample.id}`);
            console.log(`     - Type: ${sample.emergency_type}`);
            console.log(`     - User: ${sample.user_name}`);
            console.log(`     - Location: ${sample.latitude}, ${sample.longitude}`);
        } else {
            console.log('   ❌ PROBLEM: Query returned no results!');
        }

        // 5. Final verdict
        console.log('\n=== DIAGNOSIS ===');
        if (vol.verified && vol.available && incomingSOS.rows.length > 0) {
            console.log('✅ Everything looks correct! SOS requests SHOULD be visible.');
            console.log('   Possible issues:');
            console.log('   - Frontend not refreshing');
            console.log('   - API endpoint not being called');
            console.log('   - Check browser console for errors');
        } else {
            console.log('❌ Found issues:');
            if (!vol.verified) console.log('   - Volunteer not verified');
            if (!vol.available) console.log('   - Volunteer not available');
            if (incomingSOS.rows.length === 0) console.log('   - No SOS requests match criteria');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

debugVolunteerSOS();
