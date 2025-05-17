/**
 * Environment configuration with type safety and validation
 */

// Define the environment schema
export const envSchema = {
  // AWS Cognito
  NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
  NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
  NEXT_PUBLIC_USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,

  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,

  // External APIs
  TODOIST_API_KEY: process.env.TODOIST_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  NOTION_API_KEY: process.env.NOTION_API_KEY,

  // Application
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Analytics (optional)
  NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
} as const;

export type EnvSchema = typeof envSchema;

// Define required variables by environment
const requiredVariables = {
  production: [
    'NEXT_PUBLIC_AWS_REGION',
    'NEXT_PUBLIC_USER_POOL_ID',
    'NEXT_PUBLIC_USER_POOL_CLIENT_ID',
    'DATABASE_URL',
    'DATABASE_URL_UNPOOLED',
    'TODOIST_API_KEY',
    'OPENAI_API_KEY',
    'NOTION_API_KEY',
  ],
  development: [
    'NEXT_PUBLIC_AWS_REGION',
    'NEXT_PUBLIC_USER_POOL_ID',
    'NEXT_PUBLIC_USER_POOL_CLIENT_ID',
    // Database and API keys optional in development
  ],
} as const;

// Validate required environment variables
export function validateEnv() {
  const env = process.env.NODE_ENV as keyof typeof requiredVariables;
  const required = requiredVariables[env] || requiredVariables.development;

  const missing: string[] = [];

  for (const variable of required) {
    if (!process.env[variable]) {
      missing.push(variable);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      `Please check your .env files and ensure all required variables are set.`
    );
  }
}

// Helper function to get typed environment variable
export function getEnvVar<K extends keyof EnvSchema>(key: K): EnvSchema[K] {
  const value = envSchema[key];
  const env = process.env.NODE_ENV as keyof typeof requiredVariables;
  const required = requiredVariables[env] || requiredVariables.development;

  if (value === undefined && (required as readonly string[]).includes(key)) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  return value as EnvSchema[K];
}

// Helper to check if running in production
export const isProduction = () => process.env.NODE_ENV === 'production';

// Helper to check if running in development
export const isDevelopment = () => process.env.NODE_ENV === 'development';

// Helper to check if running in test
export const isTest = () => process.env.NODE_ENV === 'test';

// Export typed environment object
export const env = envSchema;
