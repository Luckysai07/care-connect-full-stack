import request from 'supertest';
import { app } from '../src/server.js'; // Ensure .js extension for imports if using ESM
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Auth Endpoints', () => {
    let testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Test User',
        phone: `${Date.now().toString().slice(-10)}`,
        role: 'user'
    };

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        if (res.statusCode !== 201) {
            console.error('Register failed:', res.statusCode, res.body);
        }

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should login the registered user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        if (res.statusCode !== 200) {
            console.error('Login failed:', res.statusCode, res.body);
        }

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('user');
    });

    it('should fail login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'WrongPassword123'
            });

        expect(res.statusCode).toEqual(401);
    });
});
