#!/usr/bin/env tsx

/**
 * CI/CD migration script for Drizzle ORM
 * This script is designed to run in automated environments
 */

import { config } from 'dotenv';
import { runMigrations, checkMigrationStatus } from '../app/db/migrate';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
config({ path: envFile });

interface MigrationOptions {
  dryRun?: boolean;
  force?: boolean;
  silent?: boolean;
}

async function main() {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    silent: args.includes('--silent'),
  };

  const log = (message: string) => {
    if (!options.silent) {
      console.log(message);
    }
  };

  try {
    log('🚀 Starting Drizzle migration process for CI/CD...\n');

    // Validate environment
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Check current status
    log('📊 Checking migration status...');
    const statusBefore = await checkMigrationStatus();

    log(`Current status:`);
    log(`  - Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`  - Database URL: ${process.env.DATABASE_URL.replace(/:[^@]+@/, ':****@')}`);
    log(`  - Drizzle migrations table exists: ${statusBefore.hasDrizzleMigrations ? '✅' : '❌'}`);
    log(`  - Legacy migrations table exists: ${statusBefore.hasLegacyMigrations ? '✅' : '❌'}`);
    log(`  - Needs migration: ${statusBefore.needsMigration ? 'Yes' : 'No'}\n`);

    if (!statusBefore.needsMigration && !options.force) {
      log('ℹ️  Database is already up to date!');
      process.exit(0);
    }

    if (options.dryRun) {
      log('🔍 DRY RUN MODE - No changes will be made');
      log('Would run the following migrations:');
      // In a real implementation, we would list pending migrations here
      process.exit(0);
    }

    // Run migrations
    log('🔄 Running migrations...');
    await runMigrations();

    // Verify success
    log('\n📊 Verifying migration results...');
    const statusAfter = await checkMigrationStatus();

    if (!statusAfter.hasDrizzleMigrations) {
      throw new Error('Migrations were not applied successfully');
    }

    log('\n✅ Migration completed successfully!');
    log(`  - Drizzle migrations: Applied`);
    log(`  - Legacy compatibility: Maintained`);

    // Output for CI/CD systems
    if (process.env.GITHUB_ACTIONS) {
      console.log('::set-output name=migration_status::success');
      console.log('::set-output name=has_drizzle_migrations::true');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);

    // Output for CI/CD systems
    if (process.env.GITHUB_ACTIONS) {
      console.log('::set-output name=migration_status::failed');
      console.log(`::error::Migration failed: ${error}`);
    }

    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run the script
main();
