#!/usr/bin/env tsx

import { initializeDatabase } from '../app/lib/migrations';

async function runMigrations() {
  console.log('Running database migrations...');

  try {
    await initializeDatabase();
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
