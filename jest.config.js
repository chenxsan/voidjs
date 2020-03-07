module.exports = {
  rootDir: '.',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/packages/htmlgaga/src/**/*.test.ts'],
  globals: {
    'ts-jest': {
      packageJson: 'package.json'
    }
  }
};
