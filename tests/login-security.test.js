const API_URL = 'http://localhost:3000/api';

async function testLoginSecurity() {
    console.log('🔒 Starting Login Security Tests...\n');

    // Helper for requests
    async function post(endpoint, data) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await response.json();
        return { status: response.status, data: json };
    }

    // 1. Test Missing Fields
    try {
        console.log('Test 1: Missing Fields (Email and Password)');
        const res = await post('/auth/login', {});

        if (res.status === 400) {
            console.log('✅ Passed: Returned 400 Bad Request');
        } else {
            console.log(`❌ Failed: Unexpected status ${res.status}`);
        }
    } catch (error) {
        console.log(`❌ Failed: Request error ${error.message}`);
    }

    // 2. Test Invalid Credentials (Generic Message)
    try {
        console.log('\nTest 2: Invalid Credentials');
        const res = await post('/auth/login', {
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
        });

        if (res.status === 401) {
            if (res.data.error && res.data.error.message === 'Invalid email or password') {
                console.log('✅ Passed: Returned 401 with Generic Message');
            } else {
                console.log(`❌ Failed: Message was not generic: "${res.data.error?.message}"`);
            }
        } else {
            console.log(`❌ Failed: Unexpected status ${res.status}`);
        }
    } catch (error) {
        console.log(`❌ Failed: Request error ${error.message}`);
    }

    console.log('\n🏁 Security Tests Completed');
}

testLoginSecurity();
