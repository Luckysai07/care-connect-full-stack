
const axios = require('axios');
const config = require('../src/config/env');

async function testLogin() {
    const url = 'http://localhost:5000/api/auth/login';
    const email = 'admin@careconnect.com';
    const password = 'Sai@9010'; // Known admin password

    console.log(`Attempting login for ${email} at ${url}...`);

    try {
        const response = await axios.post(url, {
            email,
            password
        });
        console.log('Login Successful!');
        console.log('Token:', response.data.accessToken ? 'Received' : 'Missing');
    } catch (error) {
        console.log('Login Error Details:', JSON.stringify({
            message: error.message,
            code: error.code,
            responseStatus: error.response?.status,
            responseData: error.response?.data
        }, null, 2));
    }

    /*
    // Attempt Registration
    console.log('\nAttempting Registration for debug_user@test.com...');
    try {
        const regRes = await axios.post('http://localhost:5000/api/auth/register', {
            email: `debug_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Debug User',
            phone: `123456${Math.floor(Math.random() * 10000)}`
        });
        console.log('Registration Successful!', regRes.data.user.email);
    } catch (error) {
        console.log('Registration Failed:', {
            message: error.message,
            code: error.code,
            responseStatus: error.response?.status,
            responseData: error.response?.data
        });
    }
    */
}

testLogin();
