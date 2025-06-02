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
export const migrations: Migration[] = [
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
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_created_at ON forecast_adjustments(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_inventory_item ON forecast_adjustments(inventory_item_name);
      CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_filter_context ON forecast_adjustments USING GIN(filter_context);
      CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_user_id ON forecast_adjustments(user_id);
    `,
    down: `
      DROP TABLE IF EXISTS forecast_adjustments;
    `
  },
  {
    id: '004',
    name: 'create_user_preferences_table',
    up: `
      -- Create table for storing user preferences including onboarding status
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        has_seen_welcome BOOLEAN DEFAULT FALSE,
        has_completed_tour BOOLEAN DEFAULT FALSE,
        tour_progress JSON DEFAULT '{}',
        onboarding_completed_at TIMESTAMP WITH TIME ZONE,
        tooltips_enabled BOOLEAN DEFAULT TRUE,
        preferred_help_format VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_preferences_onboarding ON user_preferences(has_seen_welcome, has_completed_tour);

      -- Create trigger to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER user_preferences_updated_at_trigger
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_user_preferences_updated_at();
    `,
    down: `
      DROP TRIGGER IF EXISTS user_preferences_updated_at_trigger ON user_preferences;
      DROP FUNCTION IF EXISTS update_user_preferences_updated_at();
      DROP TABLE IF EXISTS user_preferences;
    `
  },
  {
    id: '005',
    name: 'add_multiuser_support_to_adjustments',
    up: `
      -- Add columns to support multi-user collaboration
      ALTER TABLE forecast_adjustments
      ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      -- Add indexes for the new columns
      CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_is_active ON forecast_adjustments(is_active);
      CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_user_email ON forecast_adjustments(user_email);

      -- Add update trigger for updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_forecast_adjustments_updated_at
        BEFORE UPDATE ON forecast_adjustments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `,
    down: `
      -- Drop trigger first
      DROP TRIGGER IF EXISTS update_forecast_adjustments_updated_at ON forecast_adjustments;
      DROP FUNCTION IF EXISTS update_updated_at_column();

      -- Remove columns
      ALTER TABLE forecast_adjustments
      DROP COLUMN IF EXISTS user_email,
      DROP COLUMN IF EXISTS user_name,
      DROP COLUMN IF EXISTS is_active,
      DROP COLUMN IF EXISTS updated_at;
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
