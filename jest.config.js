module.exports = {
  rootDir: '.',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/packages/*/src/**/*.test.ts'],
  globals: {
    'ts-jest': {},
  },
}
