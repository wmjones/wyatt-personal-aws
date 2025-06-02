#!/usr/bin/env tsx

/**
 * Script to run the adjustment table migration
 * Usage: npm run migrate:adjustments
 */

import { config } from 'dotenv';
import { runMigrations } from '../app/lib/migrations';

// Load environment variables
config();

async function main() {
  console.log('Running adjustment table migration...');

  try {
    await runMigrations();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
