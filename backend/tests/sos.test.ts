import request from 'supertest';
import { app } from '../src/server.js';
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('SOS Endpoints', () => {
    let token: string;
    let user = {
        email: `sos-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'SOS User',
        phone: `${Date.now().toString().slice(-10)}`,
        role: 'user'
    };

    beforeAll(async () => {
        // Register
        const regRes = await request(app).post('/api/auth/register').send(user);
        if (regRes.statusCode !== 201) {
            console.error('SOS Test Setup Register failed:', regRes.statusCode, regRes.body);
        }

        // Login
        const loginRes = await request(app).post('/api/auth/login').send({
            email: user.email,
            password: user.password
        });

        if (loginRes.statusCode !== 200) {
            console.error('SOS Test Setup Login failed:', loginRes.statusCode, loginRes.body);
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
            console.error('SOS Create failed:', res.statusCode, res.body);
        }

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('status', 'PENDING');
        expect(res.body).toHaveProperty('emergencyType', 'MEDICAL');
    });
});
