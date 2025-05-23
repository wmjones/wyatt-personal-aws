#!/usr/bin/env npx tsx

/**
 * Database initialization script
 *
 * This script initializes the database schema for the forecast caching system.
 * Run with: npx tsx scripts/init-database.ts
 */

import { initializeDatabase, getMigrationStatus } from '../app/lib/migrations';
import { db } from '../app/lib/postgres';

async function main() {
  console.log('🚀 Starting database initialization...');

  try {
    // Test connection first
    console.log('📡 Testing database connection...');
    const connected = await db.test();

    if (!connected) {
      throw new Error('Failed to connect to database. Please check your DATABASE_URL configuration.');
    }

    console.log('✅ Database connection successful');

    // Check migration status
    console.log('📋 Checking migration status...');
    const status = await getMigrationStatus();

    console.log(`📊 Applied migrations: ${status.applied.length}`);
    console.log(`📝 Pending migrations: ${status.pending.length}`);

    if (status.pending.length > 0) {
      console.log('🔧 Running database migrations...');
      await initializeDatabase();
      console.log('✅ Database schema initialized successfully');
    } else {
      console.log('✅ Database schema is up to date');
    }

    // Final status check
    const finalStatus = await getMigrationStatus();
    console.log(`🎉 Database initialization complete!`);
    console.log(`📈 Total migrations applied: ${finalStatus.applied.length}`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    // Close database connections
    await db.close();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { main };
