import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateEnv, getEnvVar } from '../env';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and environment for each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    test('should pass validation with all required variables set', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_AWS_REGION = 'us-east-1';
      process.env.NEXT_PUBLIC_USER_POOL_ID = 'test-pool-id';
      process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID = 'test-client-id';
      process.env.DATABASE_URL = 'postgres://test';
      process.env.DATABASE_URL_UNPOOLED = 'postgres://test-direct';
      process.env.TODOIST_API_KEY = 'test-todoist-key';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.NOTION_API_KEY = 'test-notion-key';

      expect(() => validateEnv()).not.toThrow();
    });

    test('should fail validation when required variables are missing', () => {
      process.env.NODE_ENV = 'production';
      // Missing required variables

      expect(() => validateEnv()).toThrow(/Missing required environment variables/);
    });

    test('should only require minimal variables in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_AWS_REGION = 'us-east-1';
      process.env.NEXT_PUBLIC_USER_POOL_ID = 'test-pool-id';
      process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID = 'test-client-id';
      // No database or API keys required

      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe('getEnvVar', () => {
    test('should return environment variable value', () => {
      process.env.NEXT_PUBLIC_AWS_REGION = 'us-east-1';

      const value = getEnvVar('NEXT_PUBLIC_AWS_REGION');
      expect(value).toBe('us-east-1');
    });

    test('should throw error for required missing variable', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;

      expect(() => getEnvVar('DATABASE_URL')).toThrow(/DATABASE_URL is required but not set/);
    });

    test('should return undefined for optional missing variable', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_ANALYTICS_ID;

      const value = getEnvVar('NEXT_PUBLIC_ANALYTICS_ID');
      expect(value).toBeUndefined();
    });
  });
});
