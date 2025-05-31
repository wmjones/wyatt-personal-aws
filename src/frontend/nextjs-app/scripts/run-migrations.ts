#!/usr/bin/env tsx

/**
 * Simple script to run database migrations
 */

import { runMigrations, getMigrationStatus } from '../app/lib/migrations';

async function main() {
  try {
    console.log('Checking migration status...');

    const beforeStatus = await getMigrationStatus();
    console.log(`Applied: ${beforeStatus.applied.length}, Pending: ${beforeStatus.pending.length}`);

    if (beforeStatus.pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log('Running migrations...');
    await runMigrations();

    const afterStatus = await getMigrationStatus();
    console.log('Migrations completed successfully');
    console.log(`Applied: ${afterStatus.applied.length}, Pending: ${afterStatus.pending.length}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
