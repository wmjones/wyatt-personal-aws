#!/usr/bin/env tsx

/**
 * Script to check migration status for CI/CD workflows
 * This provides a simple interface for checking if migrations are needed
 */

import { checkMigrationStatus } from '../app/db/migrate';

async function main() {
  try {
    const status = await checkMigrationStatus();
    console.log('Migration Status:', JSON.stringify(status, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error type:', (error as any).code || 'Unknown');
    console.error('Error message:', (error as Error).message);

    // Different error messages for different issues
    if ((error as Error).message.includes('does not exist') || (error as Error).message.includes('not found')) {
      console.error('Database/branch may not be ready yet');
    } else if ((error as Error).message.includes('ECONNREFUSED') || (error as Error).message.includes('ETIMEDOUT')) {
      console.error('Connection issue - database may still be initializing');
    } else {
      console.error('Unexpected error - check credentials and configuration');
    }

    process.exit(1);
  }
}

main();
