/**
 * Branch-aware database connection resolution
 *
 * This module handles database URL resolution for different deployment environments:
 * - Production deployments use the main database
 * - Preview deployments use branch-specific databases
 * - Local development uses local database URL
 */

export interface DatabaseConfig {
  databaseUrl: string;
  databaseUrlUnpooled?: string;
  branchName?: string;
  environment: 'production' | 'preview' | 'development';
}

/**
 * Get the current branch name from various sources
 */
function getCurrentBranch(): string | undefined {
  // Check Vercel environment variables
  if (process.env.VERCEL_GIT_COMMIT_REF) {
    return process.env.VERCEL_GIT_COMMIT_REF;
  }

  // Check custom branch environment variable (can be set by deployment workflow)
  if (process.env.DEPLOYMENT_BRANCH) {
    return process.env.DEPLOYMENT_BRANCH;
  }

  // Local development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'local';
  }

  return undefined;
}

/**
 * Determine the deployment environment
 */
function getEnvironment(): 'production' | 'preview' | 'development' {
  // Local development
  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
    return 'development';
  }

  // Vercel deployments
  if (process.env.VERCEL_ENV === 'production') {
    return 'production';
  }

  if (process.env.VERCEL_ENV === 'preview') {
    return 'preview';
  }

  // Check branch name for production branches
  const branch = getCurrentBranch();
  if (branch === 'main' || branch === 'dev') {
    return 'production';
  }

  // Default to preview for feature branches
  return 'preview';
}

/**
 * Get branch-specific database URLs from environment
 *
 * For preview deployments, the deployment workflow sets:
 * - DATABASE_URL: Branch-specific pooled connection
 * - DATABASE_URL_UNPOOLED: Branch-specific unpooled connection
 *
 * For production deployments, these come from Vercel environment variables
 */
function getBranchDatabaseUrls(): { pooled?: string; unpooled?: string } {
  // First, check for explicitly set URLs (from deployment workflow or Vercel env)
  if (process.env.DATABASE_URL) {
    return {
      pooled: process.env.DATABASE_URL,
      unpooled: process.env.DATABASE_URL_UNPOOLED
    };
  }

  // For local development, check for local database URLs
  if (process.env.NODE_ENV === 'development') {
    return {
      pooled: process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL,
      unpooled: process.env.LOCAL_DATABASE_URL_UNPOOLED || process.env.DATABASE_URL_UNPOOLED
    };
  }

  return {};
}

/**
 * Resolve the database configuration for the current deployment
 *
 * This is the main function to use when getting database URLs
 */
export function resolveDatabaseConfig(): DatabaseConfig {
  const environment = getEnvironment();
  const branchName = getCurrentBranch();
  const urls = getBranchDatabaseUrls();

  if (!urls.pooled) {
    throw new Error(
      `No database URL found for ${environment} environment. ` +
      `Branch: ${branchName || 'unknown'}. ` +
      `Please ensure DATABASE_URL is set.`
    );
  }

  return {
    databaseUrl: urls.pooled,
    databaseUrlUnpooled: urls.unpooled,
    branchName,
    environment
  };
}

/**
 * Log database configuration (for debugging)
 */
export function logDatabaseConfig() {
  try {
    const config = resolveDatabaseConfig();
    console.log('Database Configuration:', {
      environment: config.environment,
      branch: config.branchName,
      hasPooledUrl: !!config.databaseUrl,
      hasUnpooledUrl: !!config.databaseUrlUnpooled,
      urlPrefix: config.databaseUrl?.substring(0, 30) + '...'
    });
  } catch (error) {
    console.error('Failed to resolve database configuration:', error);
  }
}

/**
 * Check if we're using a branch database
 */
export function isUsingBranchDatabase(): boolean {
  const config = resolveDatabaseConfig();
  return config.environment === 'preview' && !!config.branchName;
}

/**
 * Get a descriptive database name for logging
 */
export function getDatabaseDescription(): string {
  const config = resolveDatabaseConfig();

  if (config.environment === 'production') {
    return 'production database';
  }

  if (config.environment === 'preview' && config.branchName) {
    return `branch database (${config.branchName})`;
  }

  if (config.environment === 'development') {
    return 'local development database';
  }

  return 'unknown database';
}
