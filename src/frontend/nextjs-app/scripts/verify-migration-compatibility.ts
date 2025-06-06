#!/usr/bin/env tsx

/**
 * Verify Drizzle migration by testing various query patterns
 */

import { config } from 'dotenv';

// Load environment variables BEFORE any other imports
config({ path: '.env.local' });

import { db } from '../app/db/drizzle';
import { forecastAdjustments, userPreferences, summaryCache } from '../app/db/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

interface VerificationResult {
  testName: string;
  passed: boolean;
  details?: {
    result?: unknown;
    error?: string;
  };
}

const results: VerificationResult[] = [];

async function verifyQuery(
  testName: string,
  drizzleQuery: () => Promise<unknown>
): Promise<void> {
  try {
    console.log(`\n🔍 Testing: ${testName}`);

    const result = await drizzleQuery();

    results.push({
      testName,
      passed: true,
      details: { result }
    });

    console.log('✅ Query executed successfully');
  } catch (error) {
    results.push({
      testName,
      passed: false,
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    console.log('❌ Query failed:', error);
  }
}

async function runVerificationTests() {
  console.log('🔄 Drizzle Migration Verification Suite');
  console.log('======================================\n');

  const testUserId = 'test-user-' + Date.now();

  try {
    // Test 1: Simple SELECT
    await verifyQuery(
      'Simple SELECT from forecast_adjustments',
      async () => {
        return await db
          .select()
          .from(forecastAdjustments)
          .limit(5);
      }
    );

    // Test 2: SELECT with WHERE
    await verifyQuery(
      'SELECT with WHERE clause',
      async () => {
        return await db
          .select()
          .from(forecastAdjustments)
          .where(eq(forecastAdjustments.userId, testUserId))
          .limit(5);
      }
    );

    // Test 3: Complex WHERE with multiple conditions
    await verifyQuery(
      'Complex WHERE with AND conditions',
      async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        return await db
          .select()
          .from(forecastAdjustments)
          .where(
            and(
              eq(forecastAdjustments.userId, testUserId),
              gte(forecastAdjustments.adjustmentStartDate, '2024-01-01'),
              lte(forecastAdjustments.adjustmentEndDate, '2024-12-31')
            )
          );
      }
    );

    // Test 4: ORDER BY and LIMIT
    await verifyQuery(
      'SELECT with ORDER BY and LIMIT',
      async () => {
        return await db
          .select()
          .from(forecastAdjustments)
          .orderBy(desc(forecastAdjustments.createdAt))
          .limit(10);
      }
    );

    // Test 5: INSERT operation
    await verifyQuery(
      'INSERT new adjustment',
      async () => {
        return await db
          .insert(forecastAdjustments)
          .values({
            userId: testUserId,
            adjustmentValue: '50.5',
            inventoryItemName: 'Test Item for Verification',
            filterContext: { test: true, version: 'drizzle' },
            adjustmentStartDate: '2024-01-01',
            adjustmentEndDate: '2024-12-31',
          })
          .returning();
      }
    );

    // Test 6: UPDATE operation
    await verifyQuery(
      'UPDATE adjustment',
      async () => {
        return await db
          .update(forecastAdjustments)
          .set({
            adjustmentValue: '75.5',
            updatedAt: new Date()
          })
          .where(eq(forecastAdjustments.userId, testUserId))
          .returning();
      }
    );

    // Test 7: Raw SQL query
    await verifyQuery(
      'Raw SQL query',
      async () => {
        return await db.execute(sql`
          SELECT
            COUNT(*) as total_adjustments,
            AVG(adjustment_value) as avg_adjustment,
            MAX(adjustment_value) as max_adjustment
          FROM forecast_adjustments
          WHERE user_id = ${testUserId}
        `);
      }
    );

    // Test 8: Transaction
    await verifyQuery(
      'Transaction with multiple operations',
      async () => {
        return await db.transaction(async (tx) => {
          // Insert user preference
          await tx
            .insert(userPreferences)
            .values({
              userId: testUserId,
              tooltipsEnabled: true,
              preferredHelpFormat: 'text'
            })
            .onConflictDoNothing();

          // Update if exists
          const updated = await tx
            .update(userPreferences)
            .set({
              tooltipsEnabled: false,
              preferredHelpFormat: 'video',
              updatedAt: new Date()
            })
            .where(eq(userPreferences.userId, testUserId))
            .returning();

          return updated;
        });
      }
    );

    // Test 9: DELETE operation
    await verifyQuery(
      'DELETE operation',
      async () => {
        return await db
          .delete(forecastAdjustments)
          .where(eq(forecastAdjustments.userId, testUserId))
          .returning();
      }
    );

    // Test 10: Complex aggregation
    await verifyQuery(
      'Complex aggregation query',
      async () => {
        return await db.execute(sql`
          SELECT
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) as adjustment_count,
            SUM(adjustment_value) as total_adjustments
          FROM forecast_adjustments
          WHERE created_at >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month DESC
        `);
      }
    );

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await db.delete(userPreferences).where(eq(userPreferences.userId, testUserId));

  } catch (error) {
    console.error('❌ Unexpected error during verification:', error);
  }

  // Print summary
  console.log('\n\n📊 Verification Summary');
  console.log('======================\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`\n- ${r.testName}`);
        console.log(`  Error: ${r.details?.error}`);
      });
  }

  console.log('\n✅ Migration verification complete');
  process.exit(failed > 0 ? 1 : 0);
}

// Run the verification
runVerificationTests();
