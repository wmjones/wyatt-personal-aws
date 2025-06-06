#!/usr/bin/env tsx

/**
 * Cleanup script to remove temporary test table after migration verification
 */

import { config } from 'dotenv';

// Load environment variables BEFORE any other imports
config({ path: '.env.local' });

import { db } from '../app/db/drizzle';
import { sql } from 'drizzle-orm';

async function cleanup() {
  console.log('🧹 Cleaning up test migration artifacts...\n');

  try {
    // Drop the temporary test table
    await db.execute(sql`DROP TABLE IF EXISTS tmp_drizzle_test CASCADE`);
    console.log('✅ Dropped tmp_drizzle_test table');

    // Remove the test migration from drizzle_migrations table
    await db.execute(sql`
      DELETE FROM drizzle_migrations
      WHERE hash IN (
        SELECT hash FROM drizzle_migrations
        WHERE created_at > NOW() - INTERVAL '1 day'
        AND hash LIKE '%flowery_robin_chapel%'
      )
    `);
    console.log('✅ Removed test migration record');

    console.log('\n✨ Cleanup complete!');
    console.log('The Drizzle migration system has been verified to work correctly.');
    console.log('You can now proceed with production migrations.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.log('\nNote: The test table may have already been removed or may not exist.');
    process.exit(1);
  }

  process.exit(0);
}

// Run cleanup
cleanup();
