/**
 * Test Setup
 * 
 * Global setup for tests (database connections, etc.)
 */

import { pool } from '../src/config/database.js';

beforeAll(async () => {
    // Ensure we are in test environment
    process.env.NODE_ENV = 'test';
});

afterAll(async () => {
    // Close database pool after all tests
    await pool.end();
});
