#!/usr/bin/env node
import { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } from '@aws-sdk/client-athena';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// AWS Athena configuration
const athenaClient = new AthenaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ATHENA_DB_NAME = process.env.ATHENA_DB_NAME || 'default';
const ATHENA_OUTPUT_LOCATION = process.env.ATHENA_OUTPUT_LOCATION || 's3://your-athena-output-bucket/';
const FORECAST_TABLE_NAME = process.env.FORECAST_TABLE_NAME || 'forecast';

// Postgres configuration
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

interface ForecastRecord {
  restaurant_id: number;
  inventory_item_id: number;
  business_date: string;
  dma_id: string;
  dc_id: number;
  state: string;
  y_05: number;
  y_50: number;
  y_95: number;
}

/**
 * Create the forecast table in Postgres with optimized indexes
 */
async function createPostgresSchema() {
  console.log('Creating forecast table schema in Postgres...');

  const createTableQuery = `
    -- Create forecast table if it doesn't exist
    CREATE TABLE IF NOT EXISTS forecast_data (
      id SERIAL PRIMARY KEY,
      restaurant_id INTEGER NOT NULL,
      inventory_item_id INTEGER NOT NULL,
      business_date DATE NOT NULL,
      dma_id VARCHAR(50),
      dc_id INTEGER,
      state VARCHAR(2) NOT NULL,
      y_05 DECIMAL(10, 2),
      y_50 DECIMAL(10, 2) NOT NULL,
      y_95 DECIMAL(10, 2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(restaurant_id, inventory_item_id, business_date)
    );

    -- Create indexes for common query patterns
    CREATE INDEX IF NOT EXISTS idx_forecast_business_date
      ON forecast_data(business_date);

    CREATE INDEX IF NOT EXISTS idx_forecast_state
      ON forecast_data(state);

    CREATE INDEX IF NOT EXISTS idx_forecast_state_date
      ON forecast_data(state, business_date);

    CREATE INDEX IF NOT EXISTS idx_forecast_dma
      ON forecast_data(dma_id) WHERE dma_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_forecast_dc
      ON forecast_data(dc_id) WHERE dc_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_forecast_restaurant
      ON forecast_data(restaurant_id);

    CREATE INDEX IF NOT EXISTS idx_forecast_inventory
      ON forecast_data(inventory_item_id);

    CREATE INDEX IF NOT EXISTS idx_forecast_composite
      ON forecast_data(state, dma_id, dc_id, business_date);

    -- Create updated_at trigger
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_forecast_data_updated_at ON forecast_data;
    CREATE TRIGGER update_forecast_data_updated_at
      BEFORE UPDATE ON forecast_data
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    -- Create summary materialized view for performance
    CREATE MATERIALIZED VIEW IF NOT EXISTS forecast_summary AS
    SELECT
      state,
      business_date,
      COUNT(*) as record_count,
      AVG(y_50) as avg_forecast,
      MIN(y_05) as min_forecast_05,
      MAX(y_95) as max_forecast_95,
      SUM(y_50) as total_forecast
    FROM forecast_data
    GROUP BY state, business_date
    WITH DATA;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_forecast_summary_unique
      ON forecast_summary(state, business_date);

    CREATE INDEX IF NOT EXISTS idx_forecast_summary_date
      ON forecast_summary(business_date);
  `;

  try {
    await pgPool.query(createTableQuery);
    console.log('Schema created successfully');
  } catch (error) {
    console.error('Error creating schema:', error);
    throw error;
  }
}

/**
 * Execute Athena query and wait for results
 */
async function executeAthenaQuery(query: string): Promise<any[]> {
  try {
    // Start query execution
    const startCommand = new StartQueryExecutionCommand({
      QueryString: query,
      ResultConfiguration: {
        OutputLocation: ATHENA_OUTPUT_LOCATION,
      },
      QueryExecutionContext: {
        Database: ATHENA_DB_NAME,
      },
    });

    const { QueryExecutionId } = await athenaClient.send(startCommand);

    // Wait for query to complete
    let status = 'RUNNING';
    let attempts = 0;

    while (status === 'RUNNING' || status === 'QUEUED') {
      if (attempts++ > 60) {
        throw new Error('Query timeout');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const getStatusCommand = new GetQueryExecutionCommand({
        QueryExecutionId,
      });

      const statusResponse = await athenaClient.send(getStatusCommand);
      status = statusResponse.QueryExecution?.Status?.State || 'UNKNOWN';

      if (status === 'FAILED' || status === 'CANCELLED') {
        throw new Error(`Query failed: ${statusResponse.QueryExecution?.Status?.StateChangeReason}`);
      }
    }

    // Get results
    const getResultsCommand = new GetQueryResultsCommand({
      QueryExecutionId,
    });

    const results = await athenaClient.send(getResultsCommand);
    const rows = results.ResultSet?.Rows || [];

    // Skip header row and convert to objects
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const record: any = {};

      rows[0].Data?.forEach((col, index) => {
        const columnName = col.VarCharValue?.toLowerCase() || '';
        const value = row.Data?.[index]?.VarCharValue;

        // Type conversion based on column
        if (columnName.includes('id') || columnName === 'dc_id') {
          record[columnName] = value ? parseInt(value) : null;
        } else if (columnName.startsWith('y_')) {
          record[columnName] = value ? parseFloat(value) : null;
        } else {
          record[columnName] = value;
        }
      });

      data.push(record);
    }

    return data;
  } catch (error) {
    console.error('Error executing Athena query:', error);
    throw error;
  }
}

/**
 * Migrate data from Athena to Postgres in batches
 */
async function migrateData(batchSize: number = 10000) {
  console.log('Starting data migration from Athena to Postgres...');

  try {
    // Get total record count
    const countQuery = `SELECT COUNT(*) as total FROM ${FORECAST_TABLE_NAME}`;
    const countResult = await executeAthenaQuery(countQuery);
    const totalRecords = parseInt(countResult[0]?.total || '0');

    console.log(`Total records to migrate: ${totalRecords}`);

    // Get min and max dates for batching
    const dateRangeQuery = `
      SELECT
        MIN(business_date) as min_date,
        MAX(business_date) as max_date
      FROM ${FORECAST_TABLE_NAME}
    `;
    const dateRange = await executeAthenaQuery(dateRangeQuery);
    const minDate = dateRange[0]?.min_date;
    const maxDate = dateRange[0]?.max_date;

    if (!minDate || !maxDate) {
      throw new Error('Could not determine date range');
    }

    console.log(`Date range: ${minDate} to ${maxDate}`);

    // Process data in date-based batches
    let currentDate = new Date(minDate);
    const endDate = new Date(maxDate);
    let totalMigrated = 0;

    while (currentDate <= endDate) {
      const batchEndDate = new Date(currentDate);
      batchEndDate.setDate(batchEndDate.getDate() + 7); // Process one week at a time

      const batchQuery = `
        SELECT
          restaurant_id,
          inventory_item_id,
          business_date,
          dma_id,
          dc_id,
          state,
          y_05,
          y_50,
          y_95
        FROM ${FORECAST_TABLE_NAME}
        WHERE business_date >= DATE '${currentDate.toISOString().split('T')[0]}'
          AND business_date < DATE '${batchEndDate.toISOString().split('T')[0]}'
        ORDER BY business_date, restaurant_id, inventory_item_id
      `;

      console.log(`Fetching data for ${currentDate.toISOString().split('T')[0]} to ${batchEndDate.toISOString().split('T')[0]}...`);
      const batchData = await executeAthenaQuery(batchQuery);

      if (batchData.length > 0) {
        // Insert data into Postgres
        const insertQuery = `
          INSERT INTO forecast_data (
            restaurant_id, inventory_item_id, business_date,
            dma_id, dc_id, state, y_05, y_50, y_95
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (restaurant_id, inventory_item_id, business_date)
          DO UPDATE SET
            dma_id = EXCLUDED.dma_id,
            dc_id = EXCLUDED.dc_id,
            state = EXCLUDED.state,
            y_05 = EXCLUDED.y_05,
            y_50 = EXCLUDED.y_50,
            y_95 = EXCLUDED.y_95,
            updated_at = CURRENT_TIMESTAMP
        `;

        const client = await pgPool.connect();
        try {
          await client.query('BEGIN');

          for (const record of batchData) {
            await client.query(insertQuery, [
              record.restaurant_id,
              record.inventory_item_id,
              record.business_date,
              record.dma_id,
              record.dc_id,
              record.state,
              record.y_05,
              record.y_50,
              record.y_95
            ]);
          }

          await client.query('COMMIT');
          totalMigrated += batchData.length;
          console.log(`Migrated ${batchData.length} records (Total: ${totalMigrated}/${totalRecords})`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }

      currentDate = batchEndDate;
    }

    console.log(`Migration completed. Total records migrated: ${totalMigrated}`);

    // Refresh materialized view
    console.log('Refreshing materialized view...');
    await pgPool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY forecast_summary');

    return totalMigrated;
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

/**
 * Verify data integrity after migration
 */
async function verifyMigration() {
  console.log('Verifying migration integrity...');

  try {
    // Compare record counts
    const athenaCount = await executeAthenaQuery(`SELECT COUNT(*) as count FROM ${FORECAST_TABLE_NAME}`);
    const pgResult = await pgPool.query('SELECT COUNT(*) as count FROM forecast_data');

    const athenaTotal = parseInt(athenaCount[0]?.count || '0');
    const pgTotal = parseInt(pgResult.rows[0]?.count || '0');

    console.log(`Athena records: ${athenaTotal}`);
    console.log(`Postgres records: ${pgTotal}`);

    if (athenaTotal !== pgTotal) {
      console.warn(`Record count mismatch! Athena: ${athenaTotal}, Postgres: ${pgTotal}`);
    } else {
      console.log('Record counts match ✓');
    }

    // Compare some sample data
    const sampleQuery = `
      SELECT
        restaurant_id,
        inventory_item_id,
        business_date,
        state,
        y_50
      FROM ${FORECAST_TABLE_NAME}
      ORDER BY business_date DESC
      LIMIT 100
    `;

    const athenaSample = await executeAthenaQuery(sampleQuery);

    const pgSampleResult = await pgPool.query(`
      SELECT
        restaurant_id,
        inventory_item_id,
        business_date::text as business_date,
        state,
        y_50
      FROM forecast_data
      ORDER BY business_date DESC
      LIMIT 100
    `);

    let mismatches = 0;
    for (let i = 0; i < athenaSample.length; i++) {
      const athenaRow = athenaSample[i];
      const pgRow = pgSampleResult.rows[i];

      if (athenaRow.restaurant_id !== pgRow.restaurant_id ||
          athenaRow.inventory_item_id !== pgRow.inventory_item_id ||
          athenaRow.business_date !== pgRow.business_date ||
          Math.abs(parseFloat(athenaRow.y_50) - parseFloat(pgRow.y_50)) > 0.01) {
        mismatches++;
      }
    }

    if (mismatches > 0) {
      console.warn(`Found ${mismatches} mismatches in sample data`);
    } else {
      console.log('Sample data verification passed ✓');
    }

  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function main() {
  try {
    console.log('Starting forecast data migration to Postgres...\n');

    // Create schema
    await createPostgresSchema();

    // Migrate data
    const recordsMigrated = await migrateData();

    // Verify migration
    await verifyMigration();

    console.log('\nMigration completed successfully!');
    console.log(`Total records migrated: ${recordsMigrated}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pgPool.end();
  }
}

// Add function to record sync status
async function recordSyncStatus(syncType: string, recordsCount: number, status: string, error?: string) {
  try {
    const query = `
      INSERT INTO forecast_sync_status (
        sync_type, last_sync_timestamp, last_sync_date,
        records_synced, status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const lastSyncDate = await pgPool.query(
      'SELECT MAX(business_date) as max_date FROM forecast_data'
    );

    await pgPool.query(query, [
      syncType,
      new Date(),
      lastSyncDate.rows[0]?.max_date || null,
      recordsCount,
      status,
      error || null
    ]);
  } catch (err) {
    console.error('Failed to record sync status:', err);
  }
}

// Run if called directly
if (require.main === module) {
  // Check for sync type from environment or command line
  const syncType = process.env.SYNC_TYPE || process.argv[2] || 'full';

  main().then(async (recordsCount) => {
    await recordSyncStatus(syncType, recordsCount || 0, 'success');
  }).catch(async (error) => {
    console.error('Migration failed:', error);
    await recordSyncStatus(syncType, 0, 'failed', error.toString());
    process.exit(1);
  });
}

export { createPostgresSchema, migrateData, verifyMigration, recordSyncStatus };
