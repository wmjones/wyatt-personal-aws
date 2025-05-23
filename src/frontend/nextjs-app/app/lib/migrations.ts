/**
 * Database migration system for forecast cache schema
 *
 * This module manages database schema creation and updates
 * for the hybrid forecast data caching system.
 */

import { db, query } from './postgres';

/**
 * Migration interface
 */
interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
}

/**
 * Schema migrations for forecast caching system
 */
const migrations: Migration[] = [
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
        state VARCHAR(10),
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
        state VARCHAR(10),
        start_date DATE,
        end_date DATE,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        hit_count INTEGER DEFAULT 0
      );

      -- Table for query performance metrics
      CREATE TABLE IF NOT EXISTS forecast_cache.query_metrics (
        id SERIAL PRIMARY KEY,
        query_fingerprint VARCHAR(64) NOT NULL,
        query_type VARCHAR(50) NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        data_source VARCHAR(20) NOT NULL, -- 'cache' or 'athena'
        cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
        error_occurred BOOLEAN NOT NULL DEFAULT FALSE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        user_id VARCHAR(255),
        filters JSONB
      );

      -- Table for cache metadata and statistics
      CREATE TABLE IF NOT EXISTS forecast_cache.cache_metadata (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        metric_value JSONB NOT NULL,
        category VARCHAR(50) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for performance optimization
      CREATE INDEX IF NOT EXISTS idx_summary_cache_key ON forecast_cache.summary_cache(cache_key);
      CREATE INDEX IF NOT EXISTS idx_summary_fingerprint ON forecast_cache.summary_cache(query_fingerprint);
      CREATE INDEX IF NOT EXISTS idx_summary_expires ON forecast_cache.summary_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_summary_state ON forecast_cache.summary_cache(state);

      CREATE INDEX IF NOT EXISTS idx_timeseries_cache_key ON forecast_cache.timeseries_cache(cache_key);
      CREATE INDEX IF NOT EXISTS idx_timeseries_fingerprint ON forecast_cache.timeseries_cache(query_fingerprint);
      CREATE INDEX IF NOT EXISTS idx_timeseries_expires ON forecast_cache.timeseries_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_timeseries_dates ON forecast_cache.timeseries_cache(start_date, end_date);
      CREATE INDEX IF NOT EXISTS idx_timeseries_state ON forecast_cache.timeseries_cache(state);

      CREATE INDEX IF NOT EXISTS idx_metrics_fingerprint ON forecast_cache.query_metrics(query_fingerprint);
      CREATE INDEX IF NOT EXISTS idx_metrics_executed_at ON forecast_cache.query_metrics(executed_at);
      CREATE INDEX IF NOT EXISTS idx_metrics_data_source ON forecast_cache.query_metrics(data_source);
      CREATE INDEX IF NOT EXISTS idx_metrics_cache_hit ON forecast_cache.query_metrics(cache_hit);

      CREATE INDEX IF NOT EXISTS idx_metadata_metric_name ON forecast_cache.cache_metadata(metric_name);
      CREATE INDEX IF NOT EXISTS idx_metadata_category ON forecast_cache.cache_metadata(category);
    `,
    down: `
      DROP SCHEMA IF EXISTS forecast_cache CASCADE;
    `
  },
  {
    id: '002',
    name: 'create_migration_tracking',
    up: `
      -- Create table to track applied migrations
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
    down: `
      DROP TABLE IF EXISTS migrations;
    `
  }
];

/**
 * Check if migrations table exists and create if needed
 */
async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(10) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(): Promise<string[]> {
  await ensureMigrationsTable();

  const result = await query<{ id: string }>('SELECT id FROM migrations ORDER BY id');
  return result.rows.map(row => row.id);
}

/**
 * Apply a single migration
 */
async function applyMigration(migration: Migration): Promise<void> {
  console.log(`Applying migration ${migration.id}: ${migration.name}`);

  await db.transaction(async (client) => {
    // Execute the migration
    await client.query(migration.up);

    // Record the migration as applied
    await client.query(
      'INSERT INTO migrations (id, name) VALUES ($1, $2)',
      [migration.id, migration.name]
    );
  });

  console.log(`Migration ${migration.id} applied successfully`);
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('Checking for pending migrations...');

  const appliedMigrations = await getAppliedMigrations();
  const pendingMigrations = migrations.filter(
    migration => !appliedMigrations.includes(migration.id)
  );

  if (pendingMigrations.length === 0) {
    console.log('No pending migrations');
    return;
  }

  console.log(`Found ${pendingMigrations.length} pending migrations`);

  for (const migration of pendingMigrations) {
    await applyMigration(migration);
  }

  console.log('All migrations completed successfully');
}

/**
 * Rollback the last migration
 */
export async function rollbackLastMigration(): Promise<void> {
  const appliedMigrations = await getAppliedMigrations();

  if (appliedMigrations.length === 0) {
    console.log('No migrations to rollback');
    return;
  }

  const lastMigrationId = appliedMigrations[appliedMigrations.length - 1];
  const migration = migrations.find(m => m.id === lastMigrationId);

  if (!migration) {
    throw new Error(`Migration ${lastMigrationId} not found`);
  }

  console.log(`Rolling back migration ${migration.id}: ${migration.name}`);

  await db.transaction(async (client) => {
    // Execute the rollback
    await client.query(migration.down);

    // Remove the migration record
    await client.query('DELETE FROM migrations WHERE id = $1', [migration.id]);
  });

  console.log(`Migration ${migration.id} rolled back successfully`);
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  applied: string[];
  pending: string[];
}> {
  const appliedMigrations = await getAppliedMigrations();
  const allMigrationIds = migrations.map(m => m.id);
  const pendingMigrations = allMigrationIds.filter(
    id => !appliedMigrations.includes(id)
  );

  return {
    applied: appliedMigrations,
    pending: pendingMigrations,
  };
}

/**
 * Initialize database schema
 */
export async function initializeDatabase(): Promise<void> {
  console.log('Initializing database schema...');

  // Test connection first
  const connected = await db.test();
  if (!connected) {
    throw new Error('Cannot connect to database');
  }

  // Run migrations
  await runMigrations();

  console.log('Database initialization completed');
}
