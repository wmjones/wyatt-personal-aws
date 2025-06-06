#!/usr/bin/env tsx

/**
 * Verify compatibility between old and new database systems
 * This script compares query results between raw SQL and Drizzle
 */

import { config } from 'dotenv';

// Load environment variables BEFORE any other imports
config({ path: '.env.local' });

import { db } from '../app/db/drizzle';
import { query } from '../app/lib/postgres';
import { forecastAdjustments, userPreferences } from '../app/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

interface ComparisonResult {
  testName: string;
  passed: boolean;
  details?: {
    sqlResult?: unknown;
    drizzleResult?: unknown;
    error?: string;
  };
}

const results: ComparisonResult[] = [];

async function compareResults(
  testName: string,
  sqlQuery: () => Promise<unknown>,
  drizzleQuery: () => Promise<unknown>
): Promise<void> {
  try {
    console.log(`\n🔍 Testing: ${testName}`);

    const [sqlResult, drizzleResult] = await Promise.all([
      sqlQuery(),
      drizzleQuery()
    ]);

    // Compare results
    const sqlJson = JSON.stringify(sqlResult);
    const drizzleJson = JSON.stringify(drizzleResult);

    if (sqlJson === drizzleJson) {
      results.push({ testName, passed: true });
      console.log('✅ Results match!');
    } else {
      results.push({
        testName,
        passed: false,
        details: { sqlResult, drizzleResult }
      });
      console.log('❌ Results differ!');
      console.log('SQL Result:', JSON.stringify(sqlResult, null, 2));
      console.log('Drizzle Result:', JSON.stringify(drizzleResult, null, 2));
    }
  } catch (error) {
    results.push({
      testName,
      passed: false,
      details: { error: error instanceof Error ? error.message : String(error) }
    });
    console.log('❌ Test failed:', error);
  }
}

async function main() {
  console.log('🔄 Drizzle Migration Compatibility Test\n');
  console.log('This script verifies that Drizzle queries return the same results as raw SQL queries.\n');

  // Test 1: Simple SELECT
  await compareResults(
    'SELECT all forecast adjustments (limit 5)',
    async () => {
      const result = await query(`
        SELECT * FROM forecast_adjustments
        ORDER BY created_at DESC
        LIMIT 5
      `);
      return result.rows;
    },
    async () => {
      const result = await db
        .select()
        .from(forecastAdjustments)
        .orderBy(desc(forecastAdjustments.createdAt))
        .limit(5);

      // Convert Drizzle result to match SQL format
      return result.map(row => ({
        ...row,
        adjustment_value: row.adjustmentValue,
        filter_context: row.filterContext,
        inventory_item_name: row.inventoryItemName,
        user_id: row.userId,
        user_email: row.userEmail,
        user_name: row.userName,
        is_active: row.isActive,
        created_at: row.createdAt,
        updated_at: row.updatedAt
      }));
    }
  );

  // Test 2: SELECT with WHERE clause
  await compareResults(
    'SELECT active adjustments only',
    async () => {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM forecast_adjustments
        WHERE is_active = true
      `);
      return result.rows[0];
    },
    async () => {
      const result = await db
        .select({ count: sql<string>`count(*)` })
        .from(forecastAdjustments)
        .where(eq(forecastAdjustments.isActive, true));
      return result[0];
    }
  );

  // Test 3: User preferences
  await compareResults(
    'SELECT user preferences count',
    async () => {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM user_preferences
      `);
      return result.rows[0];
    },
    async () => {
      const result = await db
        .select({ count: sql<string>`count(*)` })
        .from(userPreferences);
      return result[0];
    }
  );

  // Test 4: Complex query with multiple conditions
  if (process.env.TEST_USER_ID) {
    await compareResults(
      'SELECT user-specific adjustments with filters',
      async () => {
        const result = await query(`
          SELECT id, adjustment_value, inventory_item_name
          FROM forecast_adjustments
          WHERE user_id = $1 AND is_active = true
          ORDER BY created_at DESC
          LIMIT 10
        `, [process.env.TEST_USER_ID]);
        return result.rows;
      },
      async () => {
        const result = await db
          .select({
            id: forecastAdjustments.id,
            adjustment_value: forecastAdjustments.adjustmentValue,
            inventory_item_name: forecastAdjustments.inventoryItemName
          })
          .from(forecastAdjustments)
          .where(
            and(
              eq(forecastAdjustments.userId, process.env.TEST_USER_ID!),
              eq(forecastAdjustments.isActive, true)
            )
          )
          .orderBy(desc(forecastAdjustments.createdAt))
          .limit(10);
        return result;
      }
    );
  }

  // Test 5: Check schema structure
  await compareResults(
    'Verify table column names',
    async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'forecast_adjustments'
        ORDER BY ordinal_position
      `);
      return result.rows;
    },
    async () => {
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'forecast_adjustments'
        ORDER BY ordinal_position
      `);
      return result.rows;
    }
  );

  // Summary
  console.log('\n📊 Compatibility Test Summary\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.testName}`);
    if (result.details?.error) {
      console.log(`   Error: ${result.details.error}`);
    }
  });

  console.log(`\nTotal: ${results.length}, Passed: ${passed}, Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n⚠️  Some compatibility tests failed. Review the differences above.');
    process.exit(1);
  } else {
    console.log('\n✅ All compatibility tests passed! Drizzle queries match SQL queries.');
    process.exit(0);
  }
}

// Run the compatibility test
main().catch((error) => {
  console.error('💥 Compatibility test crashed:', error);
  process.exit(1);
});
