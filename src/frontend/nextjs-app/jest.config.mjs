import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
    '^d3$': '<rootDir>/node_modules/d3/dist/d3.min.js',
    '^d3-(.*)$': '<rootDir>/node_modules/d3-$1/dist/d3-$1.min.js',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 60,
      statements: 60
    }
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/node_modules/**',
    '!app/**/.next/**',
    '!app/**/coverage/**',
    '!app/**/__tests__/**',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(d3|d3-.*)/)'
  ],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
}

export default createJestConfig(config)
