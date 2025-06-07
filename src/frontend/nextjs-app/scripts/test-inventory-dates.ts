import { db } from '../app/db/drizzle';
import { sql } from 'drizzle-orm';

async function testInventoryDates() {
  try {
    // Get all inventory items
    const items = await db.execute(sql`
      SELECT DISTINCT inventory_item_id
      FROM forecast_data
      ORDER BY inventory_item_id
      LIMIT 5
    `);

    console.log('First 5 inventory items:', items.rows.map(r => r.inventory_item_id));

    // Check data for first inventory item
    const firstItemId = items.rows[0]?.inventory_item_id;
    if (firstItemId) {
      const itemData = await db.execute(sql`
        SELECT
          business_date,
          COUNT(*) as location_count
        FROM forecast_data
        WHERE inventory_item_id = ${firstItemId}
          AND business_date >= '2025-01-01'
          AND business_date <= '2025-01-17'
        GROUP BY business_date
        ORDER BY business_date
      `);

      console.log(`\nDates for inventory item ${firstItemId}:`);
      itemData.rows.forEach(row => {
        console.log(`${row.business_date}: ${row.location_count} locations`);
      });

      // Get total rows for this item in date range
      const totalRows = await db.execute(sql`
        SELECT COUNT(*) as total
        FROM forecast_data
        WHERE inventory_item_id = ${firstItemId}
          AND business_date >= '2025-01-01'
          AND business_date <= '2025-01-17'
      `);

      console.log(`\nTotal rows for item ${firstItemId} in Jan 1-17: ${totalRows.rows[0].total}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testInventoryDates();
