const authService = require('../src/modules/auth/auth.service');
const { pool } = require('../src/config/database');
const bcryptUtil = require('../src/shared/utils/bcrypt.util');
const logger = require('../src/config/logger');

// Mock logger to keep output clean
logger.info = console.log;
logger.warn = console.warn;
logger.error = console.error;

async function verifyAuthRobustness() {
    console.log('Starting verification...');
    const client = await pool.connect();

    const testEmail = 'verify_test_' + Date.now() + '@example.com';
    const testPassword = 'Password123!';

    try {
        // 1. Setup Test User
        console.log('\n1. Creating test user...');
        await authService.register({
            email: testEmail,
            password: testPassword,
            name: 'Test User',
            phone: '+1234567890' + Math.floor(Math.random() * 1000) // unique phone
        });
        console.log('User created.');

        // 2. Test Success Login
        console.log('\n2. Testing successful login...');
        const successResult = await authService.login({
            email: testEmail,
            password: testPassword,
            ip: '127.0.0.1'
        });

        // Verify tracking
        const trackingCheck = await client.query(
            'SELECT last_login_ip, failed_login_attempts FROM users WHERE id = $1',
            [successResult.user.id]
        );

        if (trackingCheck.rows[0].last_login_ip !== '127.0.0.1') {
            throw new Error('Failed: IP tracking not working');
        }
        if (trackingCheck.rows[0].failed_login_attempts !== 0) {
            throw new Error('Failed: Failed attempts not reset');
        }
        console.log('✓ Successful login worked and tracked IP.');

        // 3. Test Lockout Logic
        console.log('\n3. Testing lockout logic (5 failures)...');

        for (let i = 1; i <= 5; i++) {
            try {
                await authService.login({
                    email: testEmail,
                    password: 'WrongPassword!',
                    ip: '127.0.0.1'
                });
                throw new Error(`Attempt ${i} should have failed!`);
            } catch (err) {
                if (err.message === 'Invalid email or password') {
                    console.log(`✓ Attempt ${i} failed as expected (Invalid credentials).`);
                } else if (err.message.includes('Account is temporarily locked')) {
                    // The 5th attempt might trigger lockout depending on implementation logic order,
                    // but usually it locks AFTER the 5th failure. 
                    // My implementation locks AFTER 5 failures, so the 6th attempt should send the lockout message.
                    console.log(`! Attempt ${i} triggered lockout message early?`, err.message);
                } else {
                    throw err; // Unexpected error
                }
            }
        }

        // Verify DB state after 5 failures
        const userAfterFailures = await client.query(
            'SELECT failed_login_attempts, lockout_until FROM users WHERE email = $1',
            [testEmail]
        );

        if (userAfterFailures.rows[0].failed_login_attempts !== 5) {
            throw new Error(`Failed: Expected 5 failed attempts, got ${userAfterFailures.rows[0].failed_login_attempts}`);
        }
        if (!userAfterFailures.rows[0].lockout_until) {
            throw new Error('Failed: User should be locked out but lockout_until is null');
        }
        console.log('✓ User is locked out in DB.');

        // 4. Test Lockout Enforcement (6th attempt with CORRECT password)
        console.log('\n4. Testing lockout enforcement...');
        try {
            await authService.login({
                email: testEmail,
                password: testPassword, // Correct password!
                ip: '127.0.0.1'
            });
            throw new Error('Failed: Login should have been blocked by lockout!');
        } catch (err) {
            if (err.message.includes('Account is temporarily locked')) {
                console.log('✓ Blocked as expected: ' + err.message);
            } else {
                throw new Error('Failed: Wrong error message: ' + err.message);
            }
        }

        console.log('\n----------------------------------------');
        console.log('VERIFICATION SUCCESSFUL');
        console.log('----------------------------------------');

    } catch (error) {
        console.error('\nVERIFICATION FAILED:', error.message);
        process.exit(1);
    } finally {
        // Cleanup
        await client.query('DELETE FROM users WHERE email = $1', [testEmail]);
        client.release();
        await pool.end();
    }
}

verifyAuthRobustness();
