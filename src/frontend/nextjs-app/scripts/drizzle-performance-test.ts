#!/usr/bin/env tsx

/**
 * Performance test for Drizzle ORM operations
 */

import { config } from 'dotenv';

// Load environment variables BEFORE any other imports
config({ path: '.env.local' });

import { db } from '../app/db/drizzle';
import { forecastAdjustments, userPreferences } from '../app/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

interface PerformanceResult {
  testName: string;
  drizzleTime: number;
  avgTime: number;
  operations: number;
}

const results: PerformanceResult[] = [];

async function measurePerformance(
  testName: string,
  iterations: number,
  drizzleQuery: () => Promise<unknown>
): Promise<void> {
  console.log(`\n⏱️  Testing: ${testName} (${iterations} iterations)`);

  // Warm up
  await drizzleQuery();

  // Measure Drizzle performance
  const drizzleStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await drizzleQuery();
  }
  const drizzleTime = performance.now() - drizzleStart;
  const avgTime = drizzleTime / iterations;

  console.log(`  Total time: ${drizzleTime.toFixed(2)}ms`);
  console.log(`  Average time: ${avgTime.toFixed(2)}ms`);

  results.push({
    testName,
    drizzleTime,
    avgTime,
    operations: iterations
  });
}

async function runPerformanceTests() {
  console.log('🚀 Drizzle ORM Performance Test Suite');
  console.log('=====================================\n');

  const iterations = 100;
  const testUserId = 'perf-test-user';

  try {
    // Test 1: Simple SELECT query
    await measurePerformance(
      'Simple SELECT (adjustments)',
      iterations,
      async () => {
        await db
          .select()
          .from(forecastAdjustments)
          .limit(10);
      }
    );

    // Test 2: SELECT with WHERE clause
    await measurePerformance(
      'SELECT with WHERE',
      iterations,
      async () => {
        await db
          .select()
          .from(forecastAdjustments)
          .where(eq(forecastAdjustments.userId, testUserId))
          .limit(10);
      }
    );

    // Test 3: Complex query with ordering
    await measurePerformance(
      'Complex query with ORDER BY',
      iterations,
      async () => {
        await db
          .select()
          .from(forecastAdjustments)
          .where(eq(forecastAdjustments.userId, testUserId))
          .orderBy(desc(forecastAdjustments.createdAt))
          .limit(20);
      }
    );

    // Test 4: Raw SQL query
    await measurePerformance(
      'Raw SQL query via Drizzle',
      iterations,
      async () => {
        await db.execute(sql`
          SELECT * FROM forecast_adjustments
          WHERE user_id = ${testUserId}
          ORDER BY created_at DESC
          LIMIT 20
        `);
      }
    );

    // Test 5: INSERT operation
    await measurePerformance(
      'INSERT operation',
      10, // Fewer iterations for write operations
      async () => {
        await db
          .insert(forecastAdjustments)
          .values({
            userId: testUserId,
            adjustmentValue: String(Math.random() * 100),
            inventoryItemName: `Test Item ${Date.now()}`,
            filterContext: { test: true },
            adjustmentStartDate: '2024-01-01',
            adjustmentEndDate: '2024-12-31',
          })
          .onConflictDoNothing();
      }
    );

    // Test 6: UPDATE operation
    await measurePerformance(
      'UPDATE operation',
      10,
      async () => {
        await db
          .update(userPreferences)
          .set({
            tooltipsEnabled: false,
            preferredHelpFormat: 'video',
            updatedAt: new Date()
          })
          .where(eq(userPreferences.userId, testUserId));
      }
    );

    // Test 7: Transaction
    await measurePerformance(
      'Transaction (read + write)',
      10,
      async () => {
        await db.transaction(async (tx) => {
          const user = await tx
            .select()
            .from(userPreferences)
            .where(eq(userPreferences.userId, testUserId))
            .limit(1);

          if (user.length > 0) {
            await tx
              .update(userPreferences)
              .set({ updatedAt: new Date() })
              .where(eq(userPreferences.userId, testUserId));
          }
        });
      }
    );

    // Print summary
    console.log('\n\n📊 Performance Summary');
    console.log('=====================\n');

    const table = results.map(r => ({
      'Test Name': r.testName,
      'Total Time (ms)': r.drizzleTime.toFixed(2),
      'Avg Time (ms)': r.avgTime.toFixed(2),
      'Operations': r.operations
    }));

    console.table(table);

    // Calculate overall stats
    const totalTime = results.reduce((sum, r) => sum + r.drizzleTime, 0);
    const totalOps = results.reduce((sum, r) => sum + r.operations, 0);

    console.log(`\n📈 Overall Statistics:`);
    console.log(`  Total operations: ${totalOps}`);
    console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Average operation time: ${(totalTime / totalOps).toFixed(2)}ms`);

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await db
      .delete(forecastAdjustments)
      .where(eq(forecastAdjustments.userId, testUserId));

  } catch (error) {
    console.error('❌ Error during performance test:', error);
  } finally {
    console.log('\n✅ Performance test complete');
    process.exit(0);
  }
}

// Run the tests
runPerformanceTests();
