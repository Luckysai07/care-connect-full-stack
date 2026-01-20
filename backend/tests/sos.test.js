const request = require('supertest');
const app = require('../src/server');
const fs = require('fs');

describe('SOS Endpoints', () => {
    let token;
    let user = {
        email: `sos-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'SOS User',
        phone: `${Date.now().toString().slice(-10)}`,
        role: 'user'
    };

    beforeAll(async () => {
        // Register and login
        const regRes = await request(app).post('/api/auth/register').send(user);
        if (regRes.statusCode !== 201) {
            console.error('SOS Test Setup Register failed:', regRes.statusCode);
            fs.writeFileSync('debug_sos_setup_error.json', JSON.stringify(regRes.body, null, 2));
        }

        const loginRes = await request(app).post('/api/auth/login').send({
            email: user.email,
            password: user.password
        });

        if (loginRes.statusCode !== 200) {
            console.error('SOS Test Setup Login failed:', loginRes.statusCode);
            fs.writeFileSync('debug_sos_setup_error.json', JSON.stringify(loginRes.body, null, 2));
        }
        token = loginRes.body.accessToken;
    });

    it('should create a new SOS request', async () => {
        const res = await request(app)
            .post('/api/sos')
            .set('Authorization', `Bearer ${token}`)
            .field('emergencyType', 'MEDICAL')
            .field('latitude', 12.9716)
            .field('longitude', 77.5946)
            .field('description', 'Test emergency');

        if (res.statusCode !== 201) {
            console.error('SOS Create failed:', res.statusCode);
            fs.writeFileSync('debug_sos_error.json', JSON.stringify({
                status: res.statusCode,
                body: res.body
            }, null, 2));
        }

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('status', 'PENDING');
        expect(res.body).toHaveProperty('emergencyType', 'MEDICAL');
    });
});
