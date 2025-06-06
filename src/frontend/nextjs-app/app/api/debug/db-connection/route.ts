/**
 * Debug API Route for Database Connection
 *
 * This route helps debug database connection configuration in different environments.
 * Should be removed or protected in production.
 */

import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/app/db/drizzle';
import { resolveDatabaseConfig, getDatabaseDescription, isUsingBranchDatabase } from '@/app/db/branch-connection';

export async function GET() {
  // Only allow in non-production or with debug flag
  if (process.env.NODE_ENV === 'production' && !process.env.DEBUG_DB) {
    return NextResponse.json({ error: 'Debug endpoint disabled in production' }, { status: 403 });
  }

  try {
    // Get database configuration
    const dbConfig = resolveDatabaseConfig();

    // Test database connection
    const connectionTest = { success: false, error: null as string | null };
    let databaseInfo = null;

    try {
      // Simple query to test connection
      const result = await db.execute(sql`SELECT current_database(), version(), now() as current_time`);
      connectionTest.success = true;

      if (result.rows.length > 0) {
        const row = result.rows[0] as { current_database: string; version: string; current_time: Date };
        databaseInfo = {
          database: row.current_database,
          version: row.version,
          currentTime: row.current_time,
        };
      }
    } catch (error) {
      connectionTest.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Get branch-specific information
    const branchInfo = {
      isUsingBranchDatabase: isUsingBranchDatabase(),
      description: getDatabaseDescription(),
    };

    // Environment information
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
      VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
    };

    // Response
    const response = {
      status: connectionTest.success ? 'connected' : 'disconnected',
      connectionTest,
      databaseInfo,
      configuration: {
        environment: dbConfig.environment,
        branchName: dbConfig.branchName,
        hasDatabaseUrl: !!dbConfig.databaseUrl,
        hasUnpooledUrl: !!dbConfig.databaseUrlUnpooled,
        urlPrefix: dbConfig.databaseUrl?.substring(0, 30) + '...',
      },
      branchInfo,
      envInfo,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    // Configuration error (couldn't resolve database URL)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      envInfo: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
