import { pgSchema, serial, varchar, timestamp, integer, jsonb, index, date, boolean } from 'drizzle-orm/pg-core';

// Create the forecast_cache schema
export const forecastCacheSchema = pgSchema('forecast_cache');

// Summary cache table
export const summaryCache = forecastCacheSchema.table('summary_cache', {
  id: serial('id').primaryKey(),
  cacheKey: varchar('cache_key', { length: 255 }).notNull().unique(),
  queryFingerprint: varchar('query_fingerprint', { length: 64 }).notNull(),
  state: varchar('state', { length: 50 }),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  hitCount: integer('hit_count').default(0).notNull(),
}, (table) => ({
  cacheKeyIdx: index('idx_summary_cache_key').on(table.cacheKey),
  fingerprintIdx: index('idx_summary_fingerprint').on(table.queryFingerprint),
  expiresIdx: index('idx_summary_expires').on(table.expiresAt),
  stateIdx: index('idx_summary_state').on(table.state),
}));

// Timeseries cache table
export const timeseriesCache = forecastCacheSchema.table('timeseries_cache', {
  id: serial('id').primaryKey(),
  cacheKey: varchar('cache_key', { length: 255 }).notNull().unique(),
  queryFingerprint: varchar('query_fingerprint', { length: 64 }).notNull(),
  state: varchar('state', { length: 50 }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  hitCount: integer('hit_count').default(0).notNull(),
}, (table) => ({
  cacheKeyIdx: index('idx_timeseries_cache_key').on(table.cacheKey),
  fingerprintIdx: index('idx_timeseries_fingerprint').on(table.queryFingerprint),
  expiresIdx: index('idx_timeseries_expires').on(table.expiresAt),
  datesIdx: index('idx_timeseries_dates').on(table.startDate, table.endDate),
  stateIdx: index('idx_timeseries_state').on(table.state),
}));

// Query metrics table
export const queryMetrics = forecastCacheSchema.table('query_metrics', {
  id: serial('id').primaryKey(),
  queryFingerprint: varchar('query_fingerprint', { length: 64 }).notNull(),
  queryType: varchar('query_type', { length: 50 }).notNull(),
  executionTimeMs: integer('execution_time_ms').notNull(),
  dataSource: varchar('data_source', { length: 20 }).notNull(), // 'cache' or 'athena'
  cacheHit: boolean('cache_hit').default(false).notNull(),
  errorOccurred: boolean('error_occurred').default(false).notNull(),
  executedAt: timestamp('executed_at', { withTimezone: true }).defaultNow().notNull(),
  userId: varchar('user_id', { length: 255 }),
  filters: jsonb('filters'),
}, (table) => ({
  fingerprintIdx: index('idx_metrics_fingerprint').on(table.queryFingerprint),
  executedAtIdx: index('idx_metrics_executed_at').on(table.executedAt),
  dataSourceIdx: index('idx_metrics_data_source').on(table.dataSource),
  cacheHitIdx: index('idx_metrics_cache_hit').on(table.cacheHit),
}));

// Cache metadata table
export const cacheMetadata = forecastCacheSchema.table('cache_metadata', {
  id: serial('id').primaryKey(),
  metricName: varchar('metric_name', { length: 100 }).notNull(),
  metricValue: jsonb('metric_value').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  metricNameIdx: index('idx_metadata_metric_name').on(table.metricName),
  categoryIdx: index('idx_metadata_category').on(table.category),
}));

// Type exports for TypeScript inference
export type SummaryCache = typeof summaryCache.$inferSelect;
export type NewSummaryCache = typeof summaryCache.$inferInsert;
export type TimeseriesCache = typeof timeseriesCache.$inferSelect;
export type NewTimeseriesCache = typeof timeseriesCache.$inferInsert;
export type QueryMetrics = typeof queryMetrics.$inferSelect;
export type NewQueryMetrics = typeof queryMetrics.$inferInsert;
export type CacheMetadata = typeof cacheMetadata.$inferSelect;
export type NewCacheMetadata = typeof cacheMetadata.$inferInsert;
