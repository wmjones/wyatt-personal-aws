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

async function investigateDateRange() {
  console.log('=== Date Range Investigation ===\n');

  try {
    // 1. Get overall date range in the database
    console.log('1. Overall date range in forecast_data table:');
    const dateRange = await db.execute(sql`
      SELECT
        MIN(business_date) as earliest_date,
        MAX(business_date) as latest_date,
        COUNT(DISTINCT business_date) as unique_dates
      FROM forecast_data
    `);
    console.log(dateRange.rows[0]);
    console.log();

    // 2. Check for data between Dec 31, 2024 and Jan 17, 2025
    console.log('2. Checking for data between Dec 31, 2024 and Jan 17, 2025:');
    const specificRange = await db.execute(sql`
      SELECT
        business_date,
        COUNT(*) as record_count
      FROM forecast_data
      WHERE business_date >= '2024-12-31' AND business_date <= '2025-01-17'
      GROUP BY business_date
      ORDER BY business_date
    `);
    console.log('Found', specificRange.rows.length, 'distinct dates in the range');
    specificRange.rows.forEach(row => {
      console.log(`  ${row.business_date}: ${row.record_count} records`);
    });
    console.log();

    // 3. Check for gaps in the data
    console.log('3. Checking for gaps in the data (showing first 20 dates):');
    const allDates = await db.execute(sql`
      SELECT DISTINCT business_date
      FROM forecast_data
      ORDER BY business_date
      LIMIT 20
    `);

    let prevDate: Date | null = null;
    allDates.rows.forEach((row, index) => {
      const currentDate = new Date(row.business_date as string);
      if (prevDate) {
        const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          console.log(`  GAP: ${diffDays - 1} days between ${prevDate.toISOString().split('T')[0]} and ${currentDate.toISOString().split('T')[0]}`);
        }
      }
      if (index < 10) {
        console.log(`  ${row.business_date}`);
      }
      prevDate = currentDate;
    });
    console.log();

    // 4. Sample some data to see the structure
    console.log('4. Sample data structure:');
    const sampleData = await db.execute(sql`
      SELECT *
      FROM forecast_data
      LIMIT 2
    `);
    console.log('Sample records:');
    sampleData.rows.forEach((row, index) => {
      console.log(`Record ${index + 1}:`, JSON.stringify(row, null, 2));
    });

  } catch (error) {
    console.error('Error during investigation:', error);
  }
}

// Run the investigation
investigateDateRange();
