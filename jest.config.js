module.exports = {
  displayName: 'MCP Gateway',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  testMatch: [
    '**/__tests__/**/*.spec.(ts|js)',
    '**/?(*.)+(spec|test).(ts|js)',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@/common/(.*)$': '<rootDir>/src/common/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
  },
};