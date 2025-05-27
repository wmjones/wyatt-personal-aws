#!/usr/bin/env node
import { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } from '@aws-sdk/client-athena';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Configuration interfaces
interface ETLConfig {
  targetBranch: string;
  dataMode: 'full' | 'schema-only' | 'test-data';
  tableFilter?: string;
  dateRangeDays: number;
  connectionString: string;
}

interface ETLReport {
  startTime: string;
  endTime?: string;
  duration?: string;
  recordsProcessed: number;
  tablesSynced: string[];
  errors: string[];
  validationStatus: 'pending' | 'passed' | 'failed';
  branchInfo: {
    id: string;
    mode: string;
  };
}

// Load configuration
const loadConfig = (): ETLConfig => {
  const configPath = path.join(__dirname, 'etl-config.json');
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  }

  // Fallback to environment variables
  return {
    targetBranch: process.env.TARGET_BRANCH || 'main',
    dataMode: (process.env.DATA_MODE as ETLConfig['dataMode']) || 'full',
    tableFilter: process.env.TABLE_FILTER,
    dateRangeDays: parseInt(process.env.DATE_RANGE_DAYS || '0'),
    connectionString: process.env.NEON_CONNECTION_STRING || ''
  };
};

const config = loadConfig();

// Initialize AWS Athena client
const athenaClient = new AthenaClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Initialize Postgres pool
const pgPool = new Pool({
  connectionString: config.connectionString,
  max: 20, // Higher for ETL workloads
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Initialize report
const report: ETLReport = {
  startTime: new Date().toISOString(),
  recordsProcessed: 0,
  tablesSynced: [],
  errors: [],
  validationStatus: 'pending',
  branchInfo: {
    id: config.targetBranch,
    mode: config.dataMode
  }
};

/**
 * Log messages with timestamp
 */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);

  // Also write to log file
  const logFile = path.join(__dirname, 'etl-manual.log');
  fs.appendFileSync(logFile, logMessage + '\n');
}

/**
 * Execute Athena query and return results
 */
async function executeAthenaQuery(query: string): Promise<any[]> {
  log(`Executing Athena query: ${query.substring(0, 100)}...`);

  try {
    const startCommand = new StartQueryExecutionCommand({
      QueryString: query,
      ResultConfiguration: {
        OutputLocation: process.env.ATHENA_OUTPUT_LOCATION,
      },
      QueryExecutionContext: {
        Database: process.env.ATHENA_DB_NAME || 'default',
      },
    });

    const { QueryExecutionId } = await athenaClient.send(startCommand);
    log(`Query execution ID: ${QueryExecutionId}`);

    // Wait for query completion
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 300; // 10 minutes max wait

    while (status === 'RUNNING' || status === 'QUEUED') {
      if (attempts++ > maxAttempts) {
        throw new Error('Query timeout after 10 minutes');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const getStatusCommand = new GetQueryExecutionCommand({ QueryExecutionId });
      const statusResponse = await athenaClient.send(getStatusCommand);
      status = statusResponse.QueryExecution?.Status?.State || 'UNKNOWN';

      if (attempts % 10 === 0) {
        log(`Query status: ${status} (${attempts * 2}s elapsed)`);
      }

      if (status === 'FAILED' || status === 'CANCELLED') {
        const reason = statusResponse.QueryExecution?.Status?.StateChangeReason;
        throw new Error(`Query failed: ${reason}`);
      }
    }

    log('Query completed successfully');

    // Get results
    const getResultsCommand = new GetQueryResultsCommand({ QueryExecutionId });
    const results = await athenaClient.send(getResultsCommand);
    const rows = results.ResultSet?.Rows || [];

    // Convert to objects
    const data = [];
    const headers = rows[0]?.Data?.map(col => col.VarCharValue?.toLowerCase() || '') || [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const record: any = {};

      headers.forEach((header, index) => {
        const value = row.Data?.[index]?.VarCharValue;

        // Type conversion
        if (header.includes('id') || header === 'dc_id') {
          record[header] = value ? parseInt(value) : null;
        } else if (header.startsWith('y_') || header.includes('amount') || header.includes('quantity')) {
          record[header] = value ? parseFloat(value) : null;
        } else {
          record[header] = value;
        }
      });

      data.push(record);
    }

    log(`Retrieved ${data.length} records from Athena`);
    return data;
  } catch (error) {
    log(`Error executing Athena query: ${error}`, 'error');
    report.errors.push(`Athena query error: ${error}`);
    throw error;
  }
}

/**
 * Create schema based on data mode
 */
async function createSchema(mode: ETLConfig['dataMode']) {
  log(`Creating schema for mode: ${mode}`);

  const schemaQueries = {
    'full': `
      -- Full schema with all tables and indexes
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

      -- Create all indexes
      CREATE INDEX IF NOT EXISTS idx_forecast_business_date ON forecast_data(business_date);
      CREATE INDEX IF NOT EXISTS idx_forecast_state ON forecast_data(state);
      CREATE INDEX IF NOT EXISTS idx_forecast_state_date ON forecast_data(state, business_date);
      CREATE INDEX IF NOT EXISTS idx_forecast_dma ON forecast_data(dma_id) WHERE dma_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_forecast_dc ON forecast_data(dc_id) WHERE dc_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_forecast_composite ON forecast_data(state, dma_id, dc_id, business_date);
    `,

    'schema-only': `
      -- Schema without data, minimal indexes
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

      -- Only essential indexes
      CREATE INDEX IF NOT EXISTS idx_forecast_business_date ON forecast_data(business_date);
      CREATE INDEX IF NOT EXISTS idx_forecast_state ON forecast_data(state);
    `,

    'test-data': `
      -- Schema for test data with additional test columns
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
        is_test_data BOOLEAN DEFAULT true,
        test_scenario VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(restaurant_id, inventory_item_id, business_date)
      );

      -- Basic indexes for test queries
      CREATE INDEX IF NOT EXISTS idx_forecast_test ON forecast_data(is_test_data);
      CREATE INDEX IF NOT EXISTS idx_forecast_scenario ON forecast_data(test_scenario);
    `
  };

  try {
    await pgPool.query(schemaQueries[mode]);
    log('Schema created successfully');
  } catch (error) {
    log(`Error creating schema: ${error}`, 'error');
    throw error;
  }
}

/**
 * Generate test data for test-data mode
 */
async function generateTestData() {
  log('Generating test data...');

  const states = ['CA', 'TX', 'FL', 'NY', 'IL'];
  const dmas = ['LAX', 'DFW', 'MIA', 'NYC', 'CHI'];
  const scenarios = ['baseline', 'high-demand', 'low-demand', 'seasonal-peak'];

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // Generate 30 days of test data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let day = 0; day < 30; day++) {
      const businessDate = new Date(startDate);
      businessDate.setDate(businessDate.getDate() + day);

      for (const state of states) {
        for (let restaurant = 1; restaurant <= 10; restaurant++) {
          for (let item = 1; item <= 5; item++) {
            const baseValue = Math.random() * 100 + 50;
            const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

            await client.query(
              `INSERT INTO forecast_data
               (restaurant_id, inventory_item_id, business_date, dma_id, dc_id, state,
                y_05, y_50, y_95, is_test_data, test_scenario)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
               ON CONFLICT (restaurant_id, inventory_item_id, business_date) DO UPDATE
               SET y_05 = EXCLUDED.y_05, y_50 = EXCLUDED.y_50, y_95 = EXCLUDED.y_95,
                   is_test_data = true, test_scenario = EXCLUDED.test_scenario`,
              [
                restaurant,
                item,
                businessDate.toISOString().split('T')[0],
                dmas[restaurant % dmas.length],
                restaurant % 5 + 1,
                state,
                baseValue * 0.8,
                baseValue,
                baseValue * 1.2,
                scenario
              ]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    report.recordsProcessed += 7500; // 30 days * 5 states * 10 restaurants * 5 items
    log('Test data generated successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error generating test data: ${error}`, 'error');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Sync data from Athena based on configuration
 */
async function syncData() {
  if (config.dataMode === 'schema-only') {
    log('Schema-only mode - skipping data sync');
    return;
  }

  if (config.dataMode === 'test-data') {
    await generateTestData();
    return;
  }

  // Full data sync from Athena
  let whereClause = '';
  const conditions = [];

  // Apply date range filter
  if (config.dateRangeDays > 0) {
    conditions.push(`business_date >= CURRENT_DATE - INTERVAL '${config.dateRangeDays}' DAY`);
  }

  // Apply table filter
  if (config.tableFilter) {
    const tables = config.tableFilter.split(',').map(t => t.trim());
    // For this example, we'll filter by state, but this could be adapted
    if (tables.length > 0) {
      conditions.push(`state IN (${tables.map(t => `'${t}'`).join(',')})`);
    }
  }

  if (conditions.length > 0) {
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }

  const query = `
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
    FROM forecast
    ${whereClause}
    ORDER BY business_date, restaurant_id, inventory_item_id
  `;

  log(`Fetching data from Athena with query: ${query}`);
  const data = await executeAthenaQuery(query);

  if (data.length === 0) {
    log('No data to sync', 'warn');
    return;
  }

  // Insert data in batches
  const batchSize = 1000;
  const client = await pgPool.connect();

  try {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      await client.query('BEGIN');

      for (const record of batch) {
        await client.query(
          `INSERT INTO forecast_data
           (restaurant_id, inventory_item_id, business_date, dma_id, dc_id, state, y_05, y_50, y_95)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (restaurant_id, inventory_item_id, business_date) DO UPDATE
           SET dma_id = EXCLUDED.dma_id, dc_id = EXCLUDED.dc_id, state = EXCLUDED.state,
               y_05 = EXCLUDED.y_05, y_50 = EXCLUDED.y_50, y_95 = EXCLUDED.y_95,
               updated_at = CURRENT_TIMESTAMP`,
          [
            record.restaurant_id,
            record.inventory_item_id,
            record.business_date,
            record.dma_id,
            record.dc_id,
            record.state,
            record.y_05,
            record.y_50,
            record.y_95
          ]
        );
      }

      await client.query('COMMIT');
      report.recordsProcessed += batch.length;

      log(`Processed ${i + batch.length}/${data.length} records`);
    }

    report.tablesSynced.push('forecast_data');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error syncing data: ${error}`, 'error');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Validate the ETL results
 */
async function validateResults() {
  log('Validating ETL results...');

  try {
    const validationQueries = [
      {
        name: 'Record count',
        query: 'SELECT COUNT(*) as count FROM forecast_data'
      },
      {
        name: 'Date range',
        query: 'SELECT MIN(business_date) as min_date, MAX(business_date) as max_date FROM forecast_data'
      },
      {
        name: 'State distribution',
        query: 'SELECT state, COUNT(*) as count FROM forecast_data GROUP BY state ORDER BY state'
      },
      {
        name: 'Data quality',
        query: 'SELECT COUNT(*) as null_values FROM forecast_data WHERE y_50 IS NULL'
      }
    ];

    const validationResults: any = {};

    for (const validation of validationQueries) {
      const result = await pgPool.query(validation.query);
      validationResults[validation.name] = result.rows;
      log(`Validation '${validation.name}': ${JSON.stringify(result.rows)}`);
    }

    // Check for data integrity issues
    const nullCount = validationResults['Data quality'][0]?.null_values || 0;
    if (nullCount > 0) {
      report.validationStatus = 'failed';
      report.errors.push(`Found ${nullCount} records with null y_50 values`);
    } else {
      report.validationStatus = 'passed';
    }

  } catch (error) {
    log(`Validation error: ${error}`, 'error');
    report.validationStatus = 'failed';
    report.errors.push(`Validation error: ${error}`);
  }
}

/**
 * Main ETL execution
 */
async function main() {
  try {
    log('Starting Manual Athena to Neon ETL process');
    log(`Configuration: ${JSON.stringify(config)}`);

    // Step 1: Create schema
    await createSchema(config.dataMode);

    // Step 2: Sync data
    await syncData();

    // Step 3: Validate results
    await validateResults();

    // Step 4: Generate report
    report.endTime = new Date().toISOString();
    const duration = new Date(report.endTime).getTime() - new Date(report.startTime).getTime();
    report.duration = `${Math.round(duration / 1000)}s`;

    // Write report
    const reportPath = path.join(__dirname, 'etl-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    log(`ETL process completed successfully`);
    log(`Records processed: ${report.recordsProcessed}`);
    log(`Duration: ${report.duration}`);
    log(`Validation status: ${report.validationStatus}`);

    if (report.errors.length > 0) {
      log(`Errors encountered: ${report.errors.join(', ')}`, 'warn');
    }

  } catch (error) {
    log(`ETL process failed: ${error}`, 'error');
    report.errors.push(`Fatal error: ${error}`);
    report.endTime = new Date().toISOString();

    // Write error report
    const reportPath = path.join(__dirname, 'etl-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    process.exit(1);
  } finally {
    await pgPool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { createSchema, syncData, validateResults };
