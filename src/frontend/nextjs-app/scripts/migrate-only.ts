#!/usr/bin/env npx tsx

/**
 * Database migration script that only requires database environment variables
 * Used in CI/CD where AWS credentials are not available
 */

import { Pool } from 'pg';

// Simple database connection using only DATABASE_URL
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED environment variable is required');
  }
  return url;
}

// Create a simple database pool
const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// Migration definitions (copied from migrations.ts)
const migrations = [
  {
    id: '001',
    name: 'create_forecast_cache_tables',
    up: `
      -- Create schema for forecast cache system
      CREATE SCHEMA IF NOT EXISTS forecast_cache;

      -- Table for caching forecast summary data
      CREATE TABLE IF NOT EXISTS forecast_cache.summary_cache (
        id SERIAL PRIMARY KEY,
        cache_key VARCHAR(255) UNIQUE NOT NULL,
        query_fingerprint VARCHAR(64) NOT NULL,
        state VARCHAR(50),
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        hit_count INTEGER DEFAULT 0
      );

      -- Table for caching forecast time series data
      CREATE TABLE IF NOT EXISTS forecast_cache.timeseries_cache (
        id SERIAL PRIMARY KEY,
        cache_key VARCHAR(255) UNIQUE NOT NULL,
        query_fingerprint VARCHAR(64) NOT NULL,
        state VARCHAR(50),
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        hit_count INTEGER DEFAULT 0
      );

      -- Indexes for cache tables
      CREATE INDEX IF NOT EXISTS idx_summary_cache_expires_at ON forecast_cache.summary_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_summary_cache_query_fingerprint ON forecast_cache.summary_cache(query_fingerprint);
      CREATE INDEX IF NOT EXISTS idx_summary_cache_state ON forecast_cache.summary_cache(state);
      CREATE INDEX IF NOT EXISTS idx_summary_cache_hit_count ON forecast_cache.summary_cache(hit_count DESC);

      CREATE INDEX IF NOT EXISTS idx_timeseries_cache_expires_at ON forecast_cache.timeseries_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_timeseries_cache_query_fingerprint ON forecast_cache.timeseries_cache(query_fingerprint);
      CREATE INDEX IF NOT EXISTS idx_timeseries_cache_state ON forecast_cache.timeseries_cache(state);
      CREATE INDEX IF NOT EXISTS idx_timeseries_cache_hit_count ON forecast_cache.timeseries_cache(hit_count DESC);
    `
  },
  {
    id: '002',
    name: 'create_cache_performance_table',
    up: `
      -- Table for tracking cache performance metrics
      CREATE TABLE IF NOT EXISTS forecast_cache.performance_metrics (
        id SERIAL PRIMARY KEY,
        cache_type VARCHAR(50) NOT NULL, -- 'summary' or 'timeseries'
        cache_key VARCHAR(255) NOT NULL,
        operation VARCHAR(50) NOT NULL, -- 'hit', 'miss', 'write', 'evict'
        execution_time_ms INTEGER,
        data_size_bytes INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for performance metrics
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_cache_type ON forecast_cache.performance_metrics(cache_type);
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_operation ON forecast_cache.performance_metrics(operation);
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON forecast_cache.performance_metrics(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_cache_key ON forecast_cache.performance_metrics(cache_key);
    `
  },
  {
    id: '003',
    name: 'create_forecast_adjustments_table',
    up: `
      -- Create table for storing forecast adjustments
      CREATE TABLE IF NOT EXISTS forecast_adjustments (
        id SERIAL PRIMARY KEY,
        adjustment_value DECIMAL(5,2) NOT NULL,
        filter_context JSONB NOT NULL,
        inventory_item_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_created_at ON forecast_adjustments(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_inventory_item ON forecast_adjustments(inventory_item_name);
      CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_filter_context ON forecast_adjustments USING GIN(filter_context);
    `
  }
];

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(10) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  await ensureMigrationsTable();
  const result = await query('SELECT id FROM migrations ORDER BY applied_at');
  return result.rows.map(row => row.id);
}

async function runMigrations(): Promise<void> {
  const appliedMigrations = await getAppliedMigrations();

  for (const migration of migrations) {
    if (!appliedMigrations.includes(migration.id)) {
      console.log(`Running migration ${migration.id}: ${migration.name}`);

      try {
        // Execute the migration
        await query(migration.up);

        // Record the migration as applied
        await query(
          'INSERT INTO migrations (id, name) VALUES ($1, $2)',
          [migration.id, migration.name]
        );

        console.log(`✅ Migration ${migration.id} completed`);
      } catch (error) {
        console.error(`❌ Migration ${migration.id} failed:`, error);
        throw error;
      }
    } else {
      console.log(`⏭️  Migration ${migration.id} already applied`);
    }
  }
}

async function main() {
  console.log('🚀 Running database migrations...');

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await query('SELECT 1');
    console.log('✅ Database connection successful');

    // Run migrations
    await runMigrations();

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
