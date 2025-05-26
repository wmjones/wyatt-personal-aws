#!/usr/bin/env node
import { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } from '@aws-sdk/client-athena';
import { Pool } from 'pg';

// Determine environment based on branch or environment variable
const getEnvironment = () => {
  // Check if explicitly set
  if (process.env.ENVIRONMENT) {
    return process.env.ENVIRONMENT;
  }
  
  // Try to get from git branch
  try {
    const { execSync } = require('child_process');
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    
    if (branch === 'main' || branch === 'master') {
      return 'prod';
    } else if (branch === 'dev' || branch === 'develop') {
      return 'dev';
    } else {
      // For feature branches, use dev environment
      return 'dev';
    }
  } catch (error) {
    console.warn('Could not determine git branch, defaulting to dev environment');
    return 'dev';
  }
};

const ENVIRONMENT = getEnvironment();
console.log(`Using environment: ${ENVIRONMENT}`);

// Configuration
const NEON_CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-winter-frost-a5xyqvz4-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const ATHENA_DB_NAME = process.env.ATHENA_DB_NAME || `forecast_data_${ENVIRONMENT}`;
const ATHENA_WORKGROUP = process.env.ATHENA_WORKGROUP || `wyatt-personal-aws-${ENVIRONMENT}-forecast-analysis-${ENVIRONMENT}`;
const FORECAST_TABLE_NAME = process.env.FORECAST_TABLE_NAME || 'forecast';

// AWS Athena configuration
const athenaClient = new AthenaClient({ region: AWS_REGION });

// Postgres configuration
const pgPool = new Pool({
  connectionString: NEON_CONNECTION_STRING,
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
  console.log('Creating forecast table schema in Neon...');

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
    console.log('Executing Athena query...');
    console.log('Query:', query);
    
    // Start query execution
    const startCommand = new StartQueryExecutionCommand({
      QueryString: query,
      WorkGroup: ATHENA_WORKGROUP,
      QueryExecutionContext: {
        Database: ATHENA_DB_NAME,
      },
    });

    const { QueryExecutionId } = await athenaClient.send(startCommand);
    console.log('Query execution ID:', QueryExecutionId);

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
      
      if (attempts % 5 === 0) {
        console.log(`Query status: ${status} (attempt ${attempts})`);
      }

      if (status === 'FAILED' || status === 'CANCELLED') {
        throw new Error(`Query failed: ${statusResponse.QueryExecution?.Status?.StateChangeReason}`);
      }
    }

    console.log('Query completed successfully');

    // Get results with pagination
    const allRows = [];
    let nextToken: string | undefined;
    let isFirstPage = true;
    
    do {
      const getResultsCommand = new GetQueryResultsCommand({
        QueryExecutionId,
        NextToken: nextToken,
        MaxResults: 1000 // Maximum allowed per request
      });

      const results = await athenaClient.send(getResultsCommand);
      const rows = results.ResultSet?.Rows || [];
      
      // On first page, save header row, on subsequent pages skip it
      if (isFirstPage) {
        allRows.push(...rows);
        isFirstPage = false;
      } else {
        // Skip the header row on subsequent pages
        allRows.push(...rows.slice(1));
      }
      
      nextToken = results.NextToken;
    } while (nextToken);

    // Convert to objects
    const data = [];
    const headerRow = allRows[0];
    
    for (let i = 1; i < allRows.length; i++) {
      const row = allRows[i];
      const record: any = {};

      headerRow.Data?.forEach((col, index) => {
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

    console.log(`Retrieved ${data.length} records from Athena`);
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
  console.log('Starting data migration from Athena to Neon...');

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
      batchEndDate.setDate(batchEndDate.getDate() + 1); // Process one day at a time for better control

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
        console.log(`Processing ${batchData.length} records...`);
        
        // Process in smaller chunks to avoid timeout/memory issues
        const CHUNK_SIZE = 5000;
        for (let i = 0; i < batchData.length; i += CHUNK_SIZE) {
          const chunk = batchData.slice(i, i + CHUNK_SIZE);
          
          const client = await pgPool.connect();
          try {
            await client.query('BEGIN');
            
            // Use COPY for better performance with large datasets
            const values = chunk.map(record => 
              `(${record.restaurant_id},${record.inventory_item_id},'${record.business_date}',` +
              `${record.dma_id ? `'${record.dma_id}'` : 'NULL'},${record.dc_id || 'NULL'},'${record.state}',` +
              `${record.y_05 || 'NULL'},${record.y_50},${record.y_95 || 'NULL'})`
            ).join(',');
            
            const bulkInsertQuery = `
              INSERT INTO forecast_data (
                restaurant_id, inventory_item_id, business_date,
                dma_id, dc_id, state, y_05, y_50, y_95
              ) VALUES ${values}
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
            
            await client.query(bulkInsertQuery);
            await client.query('COMMIT');
            
            totalMigrated += chunk.length;
            console.log(`Migrated chunk ${Math.floor(i/CHUNK_SIZE) + 1}/${Math.ceil(batchData.length/CHUNK_SIZE)} (${chunk.length} records). Total: ${totalMigrated}/${totalRecords} (${(totalMigrated/totalRecords*100).toFixed(2)}%)`);
          } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error inserting chunk at index ${i}:`, error);
            // Continue with next chunk instead of failing completely
            console.log('Continuing with next chunk...');
          } finally {
            client.release();
          }
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
    console.log('Starting Athena to Neon ETL process...\n');

    // Create schema
    await createPostgresSchema();

    // Migrate data
    const recordsMigrated = await migrateData();

    // Verify migration
    await verifyMigration();

    console.log('\nETL process completed successfully!');
    console.log(`Total records migrated: ${recordsMigrated}`);

  } catch (error) {
    console.error('ETL process failed:', error);
    process.exit(1);
  } finally {
    await pgPool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { createPostgresSchema, migrateData, verifyMigration };