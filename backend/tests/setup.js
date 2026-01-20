const { pool } = require('../src/config/database');

beforeAll(async () => {
    // Wait for DB connection or run migrations if needed
    // For now, we assume the test DB is ready or we are mocking
});

afterAll(async () => {
    // Close DB pool after all tests
    await pool.end();
});
