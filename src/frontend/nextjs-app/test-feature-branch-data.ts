import { Pool } from 'pg';

// Feature branch connection string from previous conversation
const FEATURE_BRANCH_URL = 'postgresql://neondb_owner:NdLg8zxnCbxl@ep-green-sea-a5k2tb5a.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function testConnection() {
  const pool = new Pool({
    connectionString: FEATURE_BRANCH_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Testing connection to feature branch...');

    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Connected successfully at:', result.rows[0].now);

    // Check if forecast_data table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'forecast_data'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✓ forecast_data table exists');

      // Get record count
      const countResult = await pool.query('SELECT COUNT(*) FROM forecast_data');
      console.log(`✓ Total records: ${countResult.rows[0].count}`);

      // Get date range
      const dateRange = await pool.query(`
        SELECT
          MIN(business_date)::text as min_date,
          MAX(business_date)::text as max_date
        FROM forecast_data
      `);
      console.log(`✓ Date range: ${dateRange.rows[0].min_date} to ${dateRange.rows[0].max_date}`);

      // Get sample data
      const sample = await pool.query(`
        SELECT restaurant_id, inventory_item_id, business_date::text, y_50
        FROM forecast_data
        ORDER BY business_date DESC
        LIMIT 3
      `);
      console.log('\nSample data (most recent):');
      sample.rows.forEach(row => {
        console.log(`  - Restaurant ${row.restaurant_id}, Item ${row.inventory_item_id}, Date ${row.business_date}, Forecast: ${row.y_50}`);
      });
    } else {
      console.log('✗ forecast_data table does not exist');
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    await pool.end();
  }
}

testConnection();
