import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '../app/db/schema';

// Initialize database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const client = neon(connectionString);
const db = drizzle(client, { schema });

async function testDateRangeIssue() {
  console.log('=== Testing Date Range Issue ===\n');

  try {
    // 1. Test the exact query the API would run
    console.log('1. Testing API query for Dec 31, 2024 to Jan 17, 2025:');
    const apiQuery = await db.execute(sql`
      SELECT
        business_date,
        COUNT(*) as record_count
      FROM forecast_data
      WHERE business_date >= '2024-12-31'
        AND business_date <= '2025-01-17'
      GROUP BY business_date
      ORDER BY business_date
    `);

    console.log(`Found ${apiQuery.rows.length} dates:`);
    apiQuery.rows.forEach(row => {
      console.log(`  ${row.business_date}: ${row.record_count} records`);
    });
    console.log();

    // 2. Check what happens with just a few days around the boundary
    console.log('2. Checking data around Dec 31, 2024 boundary:');
    const boundaryQuery = await db.execute(sql`
      SELECT
        business_date,
        COUNT(*) as record_count
      FROM forecast_data
      WHERE business_date >= '2024-12-29'
        AND business_date <= '2025-01-03'
      GROUP BY business_date
      ORDER BY business_date
    `);

    console.log(`Found ${boundaryQuery.rows.length} dates around boundary:`);
    boundaryQuery.rows.forEach(row => {
      console.log(`  ${row.business_date}: ${row.record_count} records`);
    });
    console.log();

    // 3. Get the actual min/max dates in the database
    console.log('3. Actual date range in database:');
    const actualRange = await db.execute(sql`
      SELECT
        MIN(business_date) as min_date,
        MAX(business_date) as max_date
      FROM forecast_data
    `);
    console.log(`  Min date: ${actualRange.rows[0].min_date}`);
    console.log(`  Max date: ${actualRange.rows[0].max_date}`);
    console.log();

    // 4. Check if there's any timezone conversion issue
    console.log('4. Sample date values and their storage format:');
    const sampleDates = await db.execute(sql`
      SELECT DISTINCT
        business_date,
        business_date::text as date_text,
        to_char(business_date, 'YYYY-MM-DD') as formatted_date
      FROM forecast_data
      ORDER BY business_date
      LIMIT 5
    `);

    sampleDates.rows.forEach(row => {
      console.log(`  Raw: ${row.business_date}, Text: ${row.date_text}, Formatted: ${row.formatted_date}`);
    });
    console.log();

    // 5. Test a specific inventory item across the date range
    console.log('5. Testing specific inventory item across date range:');
    const itemQuery = await db.execute(sql`
      SELECT
        inventory_item_id,
        MIN(business_date) as first_date,
        MAX(business_date) as last_date,
        COUNT(DISTINCT business_date) as date_count
      FROM forecast_data
      WHERE inventory_item_id IN (
        SELECT DISTINCT inventory_item_id
        FROM forecast_data
        LIMIT 1
      )
      GROUP BY inventory_item_id
    `);

    if (itemQuery.rows.length > 0) {
      const item = itemQuery.rows[0];
      console.log(`  Item ${item.inventory_item_id}:`);
      console.log(`    First date: ${item.first_date}`);
      console.log(`    Last date: ${item.last_date}`);
      console.log(`    Total dates: ${item.date_count}`);
    }

  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Run the test
testDateRangeIssue();
