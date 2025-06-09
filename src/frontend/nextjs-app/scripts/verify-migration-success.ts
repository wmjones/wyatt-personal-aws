#!/usr/bin/env tsx

/**
 * Verify that migrations were applied successfully
 */

import { checkMigrationStatus } from '../app/db/migrate';

async function main() {
  try {
    const status = await checkMigrationStatus();

    if (!status.hasDrizzleMigrations) {
      console.error('❌ Migrations were not applied successfully');
      process.exit(1);
    }

    console.log('✅ Migrations verified successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to verify migrations:', (error as Error).message);
    process.exit(1);
  }
}

main();
