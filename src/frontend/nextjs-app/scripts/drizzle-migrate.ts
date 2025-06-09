#!/usr/bin/env tsx

/**
 * Script to run Drizzle migrations
 * Usage: npm run drizzle:migrate:run
 */

import { config } from 'dotenv';
import { runMigrations, checkMigrationStatus } from '../app/db/migrate';

// Load environment variables
config({ path: '.env.local' });

async function main() {
  console.log('🚀 Starting Drizzle migration process...\n');

  // Check current migration status
  console.log('📊 Checking migration status...');
  const status = await checkMigrationStatus();

  console.log('Current status:');
  console.log(`  - Drizzle migrations table exists: ${status.hasDrizzleMigrations ? '✅' : '❌'}`);
  console.log(`  - Legacy migrations table exists: ${status.hasLegacyMigrations ? '✅' : '❌'}`);
  console.log(`  - Needs migration: ${status.needsMigration ? 'Yes' : 'No'}\n`);

  if (!status.needsMigration) {
    console.log('ℹ️  Database is already up to date!');
    return;
  }

  // Run migrations
  try {
    await runMigrations();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
