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

  // External APIs (optional - used by AWS Lambda backend, not Next.js frontend)
  TODOIST_API_KEY: process.env.TODOIST_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  NOTION_API_KEY: process.env.NOTION_API_KEY,

  // AWS API Gateway (required for backend communication)
  AWS_API_GATEWAY_URL: process.env.AWS_API_GATEWAY_URL,

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
    'AWS_API_GATEWAY_URL',
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
  // Skip validation during Next.js static analysis/build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn('Skipping environment validation during build phase');
    return;
  }

  // Debug environment variables (Vercel debugging)
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    console.log('Environment debug:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_UNPOOLED_SET: !!process.env.DATABASE_URL_UNPOOLED,
      AWS_API_GATEWAY_URL_SET: !!process.env.AWS_API_GATEWAY_URL,
    });
  }

  const env = process.env.NODE_ENV as keyof typeof requiredVariables;
  const required = requiredVariables[env] || requiredVariables.development;

  const missing: string[] = [];

  for (const variable of required) {
    if (!process.env[variable]) {
      missing.push(variable);
    }
  }

  if (missing.length > 0) {
    console.error('Missing environment variables details:', {
      missing,
      allEnvKeys: Object.keys(process.env).filter(key =>
        key.includes('DATABASE') || key.includes('AWS') || key.includes('NEXT_PUBLIC')
      )
    });

    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      `Please check your .env files and ensure all required variables are set.`
    );
  }
}

// Helper function to get typed environment variable
export function getEnvVar<K extends keyof EnvSchema>(key: K): EnvSchema[K] {
  const value = envSchema[key];

  // Skip validation during Next.js static analysis/build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return value as EnvSchema[K];
  }

  // On client-side, only validate public variables
  if (typeof window !== 'undefined') {
    // Don't log errors for optional variables
    const optionalVars = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_ANALYTICS_ID'];
    if (value === undefined && key.startsWith('NEXT_PUBLIC_') && !optionalVars.includes(key) && process.env.NODE_ENV === 'production') {
      console.error(`Environment variable ${key} is required but not set`);
      return undefined as EnvSchema[K];
    }
    return value as EnvSchema[K];
  }

  // Server-side validation
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
