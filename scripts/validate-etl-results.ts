#!/usr/bin/env node
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  check: string;
  status: 'passed' | 'failed' | 'warning';
  details: any;
  message?: string;
}

interface ValidationReport {
  timestamp: string;
  overallStatus: 'passed' | 'failed';
  connectionInfo: {
    branch: string;
    database: string;
  };
  checks: ValidationResult[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

// Initialize Postgres connection
const pgPool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING,
  max: 5,
  idleTimeoutMillis: 30000,
});

/**
 * Extract connection info from connection string
 */
function parseConnectionInfo(connectionString: string): { branch: string; database: string } {
  try {
    const url = new URL(connectionString);
    const pathParts = url.pathname.split('/');
    return {
      branch: url.hostname.split('.')[0] || 'unknown',
      database: pathParts[1] || 'neondb'
    };
  } catch {
    return { branch: 'unknown', database: 'unknown' };
  }
}

/**
 * Validation checks
 */
const validationChecks: Array<{
  name: string;
  check: () => Promise<ValidationResult>;
}> = [
  {
    name: 'Table existence',
    check: async () => {
      const result = await pgPool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'forecast_data'
      `);

      return {
        check: 'Table existence',
        status: result.rows.length > 0 ? 'passed' : 'failed',
        details: { tableExists: result.rows.length > 0 },
        message: result.rows.length > 0
          ? 'forecast_data table exists'
          : 'forecast_data table not found'
      };
    }
  },

  {
    name: 'Record count',
    check: async () => {
      const result = await pgPool.query('SELECT COUNT(*) as count FROM forecast_data');
      const count = parseInt(result.rows[0].count);

      return {
        check: 'Record count',
        status: count > 0 ? 'passed' : 'warning',
        details: { recordCount: count },
        message: `Found ${count.toLocaleString()} records`
      };
    }
  },

  {
    name: 'Schema validation',
    check: async () => {
      const result = await pgPool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'forecast_data'
        ORDER BY ordinal_position
      `);

      const requiredColumns = [
        'restaurant_id', 'inventory_item_id', 'business_date',
        'state', 'y_50'
      ];

      const columnNames = result.rows.map(r => r.column_name);
      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

      return {
        check: 'Schema validation',
        status: missingColumns.length === 0 ? 'passed' : 'failed',
        details: {
          columns: result.rows,
          missingRequired: missingColumns
        },
        message: missingColumns.length === 0
          ? `All ${requiredColumns.length} required columns present`
          : `Missing required columns: ${missingColumns.join(', ')}`
      };
    }
  },

  {
    name: 'Data integrity',
    check: async () => {
      const checks = await Promise.all([
        // Check for null values in required fields
        pgPool.query(`
          SELECT COUNT(*) as null_count
          FROM forecast_data
          WHERE y_50 IS NULL OR state IS NULL OR business_date IS NULL
        `),

        // Check for duplicate primary keys
        pgPool.query(`
          SELECT restaurant_id, inventory_item_id, business_date, COUNT(*) as count
          FROM forecast_data
          GROUP BY restaurant_id, inventory_item_id, business_date
          HAVING COUNT(*) > 1
          LIMIT 10
        `),

        // Check for invalid state codes
        pgPool.query(`
          SELECT DISTINCT state
          FROM forecast_data
          WHERE state NOT IN ('CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI')
        `)
      ]);

      const nullCount = parseInt(checks[0].rows[0].null_count);
      const duplicates = checks[1].rows;
      const invalidStates = checks[2].rows;

      const issues = [];
      if (nullCount > 0) issues.push(`${nullCount} records with null values`);
      if (duplicates.length > 0) issues.push(`${duplicates.length} duplicate key violations`);
      if (invalidStates.length > 0) issues.push(`${invalidStates.length} invalid state codes`);

      return {
        check: 'Data integrity',
        status: issues.length === 0 ? 'passed' : 'failed',
        details: {
          nullValues: nullCount,
          duplicates: duplicates.length,
          invalidStates: invalidStates.map(r => r.state)
        },
        message: issues.length === 0
          ? 'All data integrity checks passed'
          : `Issues found: ${issues.join(', ')}`
      };
    }
  },

  {
    name: 'Date range validation',
    check: async () => {
      const result = await pgPool.query(`
        SELECT
          MIN(business_date) as min_date,
          MAX(business_date) as max_date,
          COUNT(DISTINCT business_date) as unique_dates
        FROM forecast_data
      `);

      const { min_date, max_date, unique_dates } = result.rows[0];

      if (!min_date || !max_date) {
        return {
          check: 'Date range validation',
          status: 'failed',
          details: { min_date, max_date, unique_dates },
          message: 'No date range found'
        };
      }

      const daysDiff = Math.floor((new Date(max_date).getTime() - new Date(min_date).getTime()) / (1000 * 60 * 60 * 24));

      return {
        check: 'Date range validation',
        status: 'passed',
        details: {
          minDate: min_date,
          maxDate: max_date,
          uniqueDates: parseInt(unique_dates),
          daysCovered: daysDiff + 1
        },
        message: `Data covers ${daysDiff + 1} days from ${min_date} to ${max_date}`
      };
    }
  },

  {
    name: 'Index verification',
    check: async () => {
      const result = await pgPool.query(`
        SELECT
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'forecast_data'
        ORDER BY indexname
      `);

      const criticalIndexes = [
        'idx_forecast_business_date',
        'idx_forecast_state'
      ];

      const existingIndexes = result.rows.map(r => r.indexname);
      const missingCritical = criticalIndexes.filter(idx => !existingIndexes.includes(idx));

      return {
        check: 'Index verification',
        status: missingCritical.length === 0 ? 'passed' : 'warning',
        details: {
          totalIndexes: result.rows.length,
          indexes: result.rows.map(r => r.indexname),
          missingCritical
        },
        message: missingCritical.length === 0
          ? `All ${criticalIndexes.length} critical indexes present`
          : `Missing critical indexes: ${missingCritical.join(', ')}`
      };
    }
  },

  {
    name: 'Performance metrics',
    check: async () => {
      // Test query performance
      const start = Date.now();
      await pgPool.query(`
        SELECT state, COUNT(*) as count, AVG(y_50) as avg_forecast
        FROM forecast_data
        WHERE business_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY state
      `);
      const queryTime = Date.now() - start;

      // Get table statistics
      const stats = await pgPool.query(`
        SELECT
          pg_size_pretty(pg_total_relation_size('forecast_data')) as total_size,
          pg_size_pretty(pg_relation_size('forecast_data')) as table_size,
          pg_size_pretty(pg_indexes_size('forecast_data')) as indexes_size
      `);

      return {
        check: 'Performance metrics',
        status: queryTime < 1000 ? 'passed' : 'warning',
        details: {
          sampleQueryTime: `${queryTime}ms`,
          tableSize: stats.rows[0].table_size,
          indexesSize: stats.rows[0].indexes_size,
          totalSize: stats.rows[0].total_size
        },
        message: `Sample query completed in ${queryTime}ms, total size: ${stats.rows[0].total_size}`
      };
    }
  }
];

/**
 * Run all validation checks
 */
async function runValidation(): Promise<ValidationReport> {
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    overallStatus: 'passed',
    connectionInfo: parseConnectionInfo(process.env.NEON_CONNECTION_STRING || ''),
    checks: [],
    summary: {
      totalChecks: validationChecks.length,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  console.log('Running ETL validation checks...\n');

  for (const { name, check } of validationChecks) {
    try {
      console.log(`Running: ${name}...`);
      const result = await check();
      report.checks.push(result);

      // Update summary
      if (result.status === 'passed') {
        report.summary.passed++;
        console.log(`✓ ${result.message}`);
      } else if (result.status === 'failed') {
        report.summary.failed++;
        report.overallStatus = 'failed';
        console.log(`✗ ${result.message}`);
      } else {
        report.summary.warnings++;
        console.log(`⚠ ${result.message}`);
      }

    } catch (error) {
      report.checks.push({
        check: name,
        status: 'failed',
        details: { error: String(error) },
        message: `Check failed with error: ${error}`
      });
      report.summary.failed++;
      report.overallStatus = 'failed';
      console.log(`✗ ${name} failed: ${error}`);
    }
  }

  return report;
}

/**
 * Main validation function
 */
async function main() {
  try {
    console.log('ETL Results Validation\n');
    console.log('='.repeat(50));
    console.log(`Branch: ${parseConnectionInfo(process.env.NEON_CONNECTION_STRING || '').branch}`);
    console.log(`Database: ${parseConnectionInfo(process.env.NEON_CONNECTION_STRING || '').database}`);
    console.log('='.repeat(50) + '\n');

    const report = await runValidation();

    // Write report
    const reportPath = path.join(__dirname, 'etl-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('Validation Summary:');
    console.log(`Total checks: ${report.summary.totalChecks}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Overall status: ${report.overallStatus.toUpperCase()}`);
    console.log('='.repeat(50));

    // Exit with appropriate code
    process.exit(report.overallStatus === 'passed' ? 0 : 1);

  } catch (error) {
    console.error('Validation process failed:', error);
    process.exit(1);
  } finally {
    await pgPool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { runValidation };
