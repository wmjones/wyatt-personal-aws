#!/usr/bin/env tsx

/**
 * Test script for Drizzle migration process
 * This script verifies the migration works correctly without affecting production
 */

import { config } from 'dotenv';
import chalk from 'chalk';

// Load environment variables BEFORE any other imports
config({ path: '.env.local' });

import { db, getPooledDb, closeConnections } from '../app/db/drizzle';
import {
  forecastAdjustments,
  userPreferences,
  summaryCache,
  timeseriesCache,
  queryMetrics,
  migrations
} from '../app/db/schema';
import { sql } from 'drizzle-orm';
import { runMigrations, checkMigrationStatus } from '../app/db/migrate';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: unknown;
}

const tests: TestResult[] = [];

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const prefix = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warning: chalk.yellow('⚠')
  };

  console.log(`${prefix[type]} ${message}`);
}

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  try {
    log(`Testing: ${name}`, 'info');
    await testFn();
    tests.push({ name, passed: true });
    log(`Passed: ${name}`, 'success');
  } catch (error) {
    tests.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    });
    log(`Failed: ${name} - ${error}`, 'error');
  }
}

async function main() {
  console.log(chalk.bold('\n🧪 Drizzle Migration Test Suite\n'));

  // 1. Test database connection
  await runTest('Database connection', async () => {
    const result = await db.execute(sql`SELECT 1 as test`);
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to execute test query');
    }
  });

  // 2. Check migration status before running
  await runTest('Check initial migration status', async () => {
    const status = await checkMigrationStatus();
    console.log('  Migration status:', status);
  });

  // 3. Run migrations
  await runTest('Run Drizzle migrations', async () => {
    await runMigrations();
  });

  // 4. Verify schema creation
  await runTest('Verify forecast_cache schema exists', async () => {
    const result = await db.execute(sql`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name = 'forecast_cache'
    `);
    if (result.rows.length === 0) {
      throw new Error('forecast_cache schema not created');
    }
  });

  // 5. Test table creation
  await runTest('Verify all tables exist', async () => {
    const tables = [
      'forecast_adjustments',
      'user_preferences',
      'migrations',
      'forecast_cache.summary_cache',
      'forecast_cache.timeseries_cache',
      'forecast_cache.query_metrics',
      'forecast_cache.cache_metadata'
    ];

    for (const table of tables) {
      const [schema, tableName] = table.includes('.')
        ? table.split('.')
        : ['public', table];

      const result = await db.execute(sql`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = ${schema}
        AND tablename = ${tableName}
      `);

      if (result.rows.length === 0) {
        throw new Error(`Table ${table} not found`);
      }
    }
  });

  // 6. Test Drizzle queries
  await runTest('Test Drizzle SELECT queries', async () => {
    // Test simple select
    const adjustments = await db.select().from(forecastAdjustments).limit(1);
    console.log(`  Found ${adjustments.length} adjustments`);

    // Test with pooled connection
    const pooledDb = getPooledDb();
    const preferences = await pooledDb.select().from(userPreferences).limit(1);
    console.log(`  Found ${preferences.length} user preferences`);
  });

  // 7. Test Drizzle INSERT
  await runTest('Test Drizzle INSERT operations', async () => {
    const testUserId = 'test-user-' + Date.now();

    // Insert test user preference
    const [inserted] = await db
      .insert(userPreferences)
      .values({
        userId: testUserId,
        hasSeenWelcome: false,
        hasCompletedTour: false,
        tourProgress: {},
        tooltipsEnabled: true,
        preferredHelpFormat: 'text'
      })
      .returning();

    if (!inserted || inserted.userId !== testUserId) {
      throw new Error('Failed to insert test record');
    }

    // Clean up
    await db.delete(userPreferences).where(sql`${userPreferences.userId} = ${testUserId}`);
  });

  // 8. Test indexes
  await runTest('Verify indexes exist', async () => {
    const indexes = [
      'idx_forecast_adjustments_created_at',
      'idx_user_preferences_user_id',
      'idx_summary_cache_key',
      'idx_timeseries_cache_key'
    ];

    for (const indexName of indexes) {
      const result = await db.execute(sql`
        SELECT indexname
        FROM pg_indexes
        WHERE indexname = ${indexName}
      `);

      if (result.rows.length === 0) {
        throw new Error(`Index ${indexName} not found`);
      }
    }
  });

  // 9. Test triggers
  await runTest('Verify update triggers work', async () => {
    const testUserId = 'trigger-test-' + Date.now();

    // Insert a record
    const [inserted] = await db
      .insert(userPreferences)
      .values({ userId: testUserId })
      .returning();

    const originalUpdatedAt = inserted.updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the record
    const [updated] = await db
      .update(userPreferences)
      .set({ hasSeenWelcome: true })
      .where(sql`${userPreferences.userId} = ${testUserId}`)
      .returning();

    // Verify updatedAt changed
    if (updated.updatedAt.getTime() <= originalUpdatedAt.getTime()) {
      throw new Error('Update trigger did not update timestamp');
    }

    // Clean up
    await db.delete(userPreferences).where(sql`${userPreferences.userId} = ${testUserId}`);
  });

  // 10. Test transaction support
  await runTest('Test transaction rollback', async () => {
    const pooledDb = getPooledDb();
    const testUserId = 'transaction-test-' + Date.now();

    try {
      await pooledDb.transaction(async (tx) => {
        // Insert a record
        await tx.insert(userPreferences).values({ userId: testUserId });

        // Force an error to trigger rollback
        throw new Error('Intentional rollback');
      });
    } catch (error) {
      // Expected error
    }

    // Verify record was not inserted
    const records = await db
      .select()
      .from(userPreferences)
      .where(sql`${userPreferences.userId} = ${testUserId}`);

    if (records.length > 0) {
      throw new Error('Transaction rollback failed');
    }
  });

  // Close connections
  await closeConnections();

  // Summary
  console.log(chalk.bold('\n📊 Test Summary\n'));

  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;

  tests.forEach(test => {
    const icon = test.passed ? chalk.green('✓') : chalk.red('✗');
    const name = test.passed ? test.name : chalk.red(test.name);
    console.log(`${icon} ${name}`);
    if (test.error) {
      console.log(chalk.gray(`  Error: ${test.error}`));
    }
  });

  console.log('\n' + chalk.bold(`Total: ${tests.length}, Passed: ${chalk.green(passed)}, Failed: ${chalk.red(failed)}`));

  if (failed > 0) {
    console.log(chalk.red('\n❌ Some tests failed!'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ All tests passed!'));
    process.exit(0);
  }
}

// Run tests
main().catch((error) => {
  console.error(chalk.red('\n💥 Test suite crashed:'), error);
  process.exit(1);
});
