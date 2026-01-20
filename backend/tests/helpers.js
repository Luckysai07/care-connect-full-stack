const { pool } = require('../src/config/database');
const jwt = require('jsonwebtoken');

const createTestUser = async (role = 'USER') => {
    const email = `test-${Date.now()}@example.com`;
    const passwordHash = 'hashedpassword';

    const user = await pool.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
        [email, passwordHash, role]
    );

    return user.rows[0];
};

const generateAuthToken = (user) => {
    return jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_ACCESS_SECRET || 'test-secret-key-123',
        { expiresIn: '15m' }
    );
};

const cleanup = async () => {
    await pool.query('DELETE FROM users WHERE email LIKE \'test-%\'');
};

module.exports = {
    createTestUser,
    generateAuthToken,
    cleanup
};
