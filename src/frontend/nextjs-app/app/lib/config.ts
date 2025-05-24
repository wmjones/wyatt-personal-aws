import { validateEnv, getEnvVar } from './env';

// Validate environment on module load
if (typeof window === 'undefined') {
  // Only validate on server-side
  validateEnv();
}

/**
 * Application configuration
 * This provides a structured way to access environment variables
 */
export const config = {
  app: {
    name: 'D3 Dashboard',
    description: 'Interactive visualizations and productivity workflows',
    url: getEnvVar('NEXT_PUBLIC_API_URL') || 'http://localhost:3000',
    env: getEnvVar('NODE_ENV') || 'development',
  },

  auth: {
    aws: {
      region: getEnvVar('NEXT_PUBLIC_AWS_REGION') || 'us-east-1',
      userPoolId: getEnvVar('NEXT_PUBLIC_USER_POOL_ID') || '',
      clientId: getEnvVar('NEXT_PUBLIC_USER_POOL_CLIENT_ID') || '',
    },
  },

  database: {
    url: getEnvVar('DATABASE_URL'),
    urlUnpooled: getEnvVar('DATABASE_URL_UNPOOLED'),
  },

  // External APIs (optional - handled by AWS Lambda backend)
  external: {
    todoist: {
      apiKey: getEnvVar('TODOIST_API_KEY'), // Optional: Used by AWS Lambda, not Next.js
      baseUrl: 'https://api.todoist.com/rest/v2',
    },
    openai: {
      apiKey: getEnvVar('OPENAI_API_KEY'), // Optional: Used by AWS Lambda, not Next.js
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4-turbo-preview',
    },
    notion: {
      apiKey: getEnvVar('NOTION_API_KEY'), // Optional: Used by AWS Lambda, not Next.js
      baseUrl: 'https://api.notion.com/v1',
      version: '2022-06-28',
    },
  },

  // AWS Backend
  aws: {
    apiGatewayUrl: getEnvVar('AWS_API_GATEWAY_URL'),
  },

  analytics: {
    id: getEnvVar('NEXT_PUBLIC_ANALYTICS_ID'),
  },

  features: {
    // Feature flags can be controlled via environment variables
    darkMode: true,
    analytics: !!getEnvVar('NEXT_PUBLIC_ANALYTICS_ID'),
    debugMode: getEnvVar('NODE_ENV') === 'development',
  },
} as const;

export type Config = typeof config;

// Export helper functions
export { isProduction, isDevelopment, isTest } from './env';

// Client-safe config (only public variables)
export const clientConfig = {
  app: {
    name: config.app.name,
    description: config.app.description,
    url: config.app.url,
  },
  auth: {
    aws: config.auth.aws,
  },
  analytics: config.analytics,
  features: config.features,
} as const;

export type ClientConfig = typeof clientConfig;
