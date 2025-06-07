import { db } from '../app/db/drizzle';
import { sql } from 'drizzle-orm';
import { forecastData } from '../app/db/schema/forecast-data';

async function testDateRange() {
  try {
    // Get date range and count
    const result = await db.execute(sql`
      SELECT
        MIN(business_date) as min_date,
        MAX(business_date) as max_date,
        COUNT(DISTINCT business_date) as unique_dates,
        COUNT(*) as total_rows
      FROM forecast_data
      WHERE business_date >= '2025-01-01'
        AND business_date <= '2025-03-31'
    `);

    console.log('Date range analysis:', result.rows[0]);

    // Get daily counts
    const dailyCounts = await db.execute(sql`
      SELECT
        business_date,
        COUNT(*) as row_count
      FROM forecast_data
      WHERE business_date >= '2025-01-01'
        AND business_date <= '2025-01-31'
      GROUP BY business_date
      ORDER BY business_date
      LIMIT 20
    `);

    console.log('\nDaily row counts (first 20 days):');
    dailyCounts.rows.forEach(row => {
      console.log(`${row.business_date}: ${row.row_count} rows`);
    });

    // Test specific inventory item
    const itemTest = await db.execute(sql`
      SELECT
        inventory_item_id,
        COUNT(DISTINCT business_date) as unique_dates,
        MIN(business_date) as min_date,
        MAX(business_date) as max_date
      FROM forecast_data
      WHERE inventory_item_id = 1
        AND business_date >= '2025-01-01'
        AND business_date <= '2025-03-31'
      GROUP BY inventory_item_id
    `);

    console.log('\nInventory item 1 date range:', itemTest.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testDateRange();
