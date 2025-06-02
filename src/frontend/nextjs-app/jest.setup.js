import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill Request/Response for Next.js server components
global.Request = class Request {
  constructor(input, init) {
    this.url = input
    this.method = init?.method || 'GET'
    this.headers = new Map(Object.entries(init?.headers || {}))
    this.body = init?.body
  }

  async json() {
    return JSON.parse(this.body)
  }
}

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Map(Object.entries(init?.headers || {}))
  }

  async json() {
    return JSON.parse(this.body)
  }
}

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

// Mock window.confirm for component tests
global.confirm = jest.fn(() => true);

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
