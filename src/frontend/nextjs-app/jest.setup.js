import '@testing-library/jest-dom'

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: 'http://localhost:3000',
  NEXT_PUBLIC_COGNITO_USER_POOL_ID: 'test-pool-id',
  NEXT_PUBLIC_COGNITO_CLIENT_ID: 'test-client-id',
  NEXT_PUBLIC_ANALYTICS_ID: 'test-analytics-id',
  DATABASE_URL: 'postgresql://test@localhost:5432/test',
  DATABASE_URL_UNPOOLED: 'postgresql://test@localhost:5432/test',
  NEXT_PUBLIC_AWS_REGION: 'us-east-1',
  NEXT_PUBLIC_USER_POOL_ID: 'test-pool-id',
  NEXT_PUBLIC_USER_POOL_CLIENT_ID: 'test-client-id',
  AWS_API_GATEWAY_URL: 'https://api.test.com',
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock AWS Cognito
jest.mock('amazon-cognito-identity-js', () => ({
  CognitoUserPool: jest.fn().mockImplementation(() => ({
    getCurrentUser: jest.fn(),
    signUp: jest.fn(),
    authenticateUser: jest.fn(),
  })),
  CognitoUser: jest.fn(),
  AuthenticationDetails: jest.fn(),
  CognitoUserAttribute: jest.fn(),
}));
