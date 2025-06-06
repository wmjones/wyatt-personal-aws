#!/usr/bin/env tsx

/**
 * Performance comparison between raw SQL and Drizzle ORM
 */

import { config } from 'dotenv';

// Load environment variables BEFORE any other imports
config({ path: '.env.local' });

import { db } from '../app/db/drizzle';
import { query } from '../app/lib/postgres';
import { forecastAdjustments, userPreferences } from '../app/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

interface PerformanceResult {
  testName: string;
  sqlTime: number;
  drizzleTime: number;
  difference: number;
  percentDiff: number;
}

const results: PerformanceResult[] = [];

async function measurePerformance(
  testName: string,
  iterations: number,
  sqlQuery: () => Promise<unknown>,
  drizzleQuery: () => Promise<unknown>
): Promise<void> {
  console.log(`\n⏱️  Testing: ${testName} (${iterations} iterations)`);

  // Warm up
  await sqlQuery();
  await drizzleQuery();

  // Measure SQL performance
  const sqlStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await sqlQuery();
  }
  const sqlTime = performance.now() - sqlStart;
  const avgSqlTime = sqlTime / iterations;

  // Measure Drizzle performance
  const drizzleStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await drizzleQuery();
  }
  const drizzleTime = performance.now() - drizzleStart;
  const avgDrizzleTime = drizzleTime / iterations;

  // Calculate difference
  const difference = avgDrizzleTime - avgSqlTime;
  const percentDiff = ((difference / avgSqlTime) * 100);

  results.push({
    testName,
    sqlTime: avgSqlTime,
    drizzleTime: avgDrizzleTime,
    difference,
    percentDiff
  });

  console.log(`  SQL avg: ${avgSqlTime.toFixed(2)}ms`);
  console.log(`  Drizzle avg: ${avgDrizzleTime.toFixed(2)}ms`);
  console.log(`  Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(2)}ms (${percentDiff > 0 ? '+' : ''}${percentDiff.toFixed(1)}%)`);
}

async function main() {
  console.log('🏃 Drizzle ORM Performance Test\n');
  console.log('Comparing performance between raw SQL queries and Drizzle ORM...\n');

  const iterations = 100;

  // Test 1: Simple SELECT
  await measurePerformance(
    'Simple SELECT (all columns)',
    iterations,
    async () => {
      await query('SELECT * FROM forecast_adjustments LIMIT 10');
    },
    async () => {
      await db.select().from(forecastAdjustments).limit(10);
    }
  );

  // Test 2: SELECT with WHERE
  await measurePerformance(
    'SELECT with WHERE clause',
    iterations,
    async () => {
      await query('SELECT * FROM forecast_adjustments WHERE is_active = true LIMIT 10');
    },
    async () => {
      await db
        .select()
        .from(forecastAdjustments)
        .where(eq(forecastAdjustments.isActive, true))
        .limit(10);
    }
  );

  // Test 3: Aggregation
  await measurePerformance(
    'COUNT aggregation',
    iterations,
    async () => {
      await query('SELECT COUNT(*) FROM forecast_adjustments');
    },
    async () => {
      await db.select({ count: sql<number>`count(*)` }).from(forecastAdjustments);
    }
  );

  // Test 4: Complex query
  await measurePerformance(
    'Complex query with ORDER BY',
    iterations,
    async () => {
      await query(`
        SELECT id, adjustment_value, created_at
        FROM forecast_adjustments
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 20
      `);
    },
    async () => {
      await db
        .select({
          id: forecastAdjustments.id,
          adjustmentValue: forecastAdjustments.adjustmentValue,
          createdAt: forecastAdjustments.createdAt
        })
        .from(forecastAdjustments)
        .where(eq(forecastAdjustments.isActive, true))
        .orderBy(desc(forecastAdjustments.createdAt))
        .limit(20);
    }
  );

  // Test 5: Single row fetch
  await measurePerformance(
    'Single row fetch by ID',
    iterations,
    async () => {
      await query('SELECT * FROM user_preferences WHERE user_id = $1', ['test-user']);
    },
    async () => {
      await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, 'test-user'))
        .limit(1);
    }
  );

  // Summary
  console.log('\n📊 Performance Test Summary\n');
  console.log('| Test | SQL (ms) | Drizzle (ms) | Diff (ms) | Diff (%) |');
  console.log('|------|----------|--------------|-----------|----------|');

  results.forEach(result => {
    const diffColor = result.percentDiff > 10 ? '🔴' : result.percentDiff > 5 ? '🟡' : '🟢';
    console.log(
      `| ${result.testName.padEnd(40)} | ${result.sqlTime.toFixed(2).padStart(8)} | ${
        result.drizzleTime.toFixed(2).padStart(12)
      } | ${(result.difference > 0 ? '+' : '') + result.difference.toFixed(2).padStart(9)} | ${
        diffColor
      } ${(result.percentDiff > 0 ? '+' : '') + result.percentDiff.toFixed(1).padStart(7)}% |`
    );
  });

  const avgDiff = results.reduce((sum, r) => sum + r.percentDiff, 0) / results.length;
  console.log(`\nAverage performance difference: ${avgDiff > 0 ? '+' : ''}${avgDiff.toFixed(1)}%`);

  if (avgDiff > 20) {
    console.log('\n⚠️  Drizzle is significantly slower than raw SQL. Consider optimization.');
  } else if (avgDiff > 10) {
    console.log('\n🟡 Drizzle has moderate overhead compared to raw SQL.');
  } else {
    console.log('\n✅ Drizzle performance is acceptable compared to raw SQL.');
  }
}

// Run the performance test
main().catch((error) => {
  console.error('💥 Performance test crashed:', error);
  process.exit(1);
});
