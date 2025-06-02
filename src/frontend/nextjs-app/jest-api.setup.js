// Mock environment variables for API tests
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
};
