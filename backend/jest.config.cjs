/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest', // Standard preset, not ESM
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/tests/'
    ],
    globalSetup: '<rootDir>/tests/setup.ts',
    globalTeardown: '<rootDir>/tests/teardown.ts',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: false, // Disable ESM for tests
            tsconfig: 'tsconfig.test.json' // Use CJS config
        }],
    }
};
