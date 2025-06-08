#!/usr/bin/env tsx

/**
 * Migration script for GitHub Actions workflow
 *
 * This script runs database migrations without starting a development server.
 * It's used in the deployment workflow to ensure the database schema is up to date.
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '../app/db/drizzle';
import { resolveDatabaseConfig } from '../app/db/branch-connection';
import path from 'path';

async function main() {
  console.log('🔄 Running database migrations...');

  try {
    // Log database configuration
    const dbConfig = resolveDatabaseConfig();
    console.log('Database configuration:', {
      environment: dbConfig.environment,
      branch: dbConfig.branchName,
      hasDatabaseUrl: !!dbConfig.databaseUrl
    });

    // Run migrations
    const migrationsPath = path.join(process.cwd(), 'drizzle');
    console.log('Migrations path:', migrationsPath);

    await migrate(db, {
      migrationsFolder: migrationsPath,
    });

    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
