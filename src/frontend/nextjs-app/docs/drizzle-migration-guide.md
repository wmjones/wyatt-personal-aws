# Drizzle ORM Migration Guide

This guide helps you migrate from the custom PostgreSQL query system to Drizzle ORM.

## Table of Contents
1. [Overview](#overview)
2. [Schema Mapping](#schema-mapping)
3. [Query Conversion](#query-conversion)
4. [Migration Strategy](#migration-strategy)
5. [Testing](#testing)

## Overview

The migration from custom SQL queries to Drizzle ORM provides:
- **Type Safety**: Full TypeScript inference for all database operations
- **Better DX**: Autocomplete and compile-time error checking
- **Maintainability**: Easier to refactor and understand
- **Performance**: Optimized query generation

## Schema Mapping

### Table Name Conversions

| Original Table | Drizzle Schema Export |
|---------------|----------------------|
| `forecast_adjustments` | `forecastAdjustments` |
| `user_preferences` | `userPreferences` |
| `forecast_cache.summary_cache` | `summaryCache` |
| `forecast_cache.timeseries_cache` | `timeseriesCache` |
| `forecast_cache.query_metrics` | `queryMetrics` |
| `forecast_cache.cache_metadata` | `cacheMetadata` |
| `migrations` | `migrations` |

### Column Name Conversions

Drizzle uses camelCase for column names in TypeScript, but they map to snake_case in the database:

```typescript
// TypeScript (Drizzle)
forecastAdjustments.adjustmentValue
forecastAdjustments.filterContext
forecastAdjustments.inventoryItemName

// Database columns
adjustment_value
filter_context
inventory_item_name
```

## Query Conversion

### Basic Patterns

#### SELECT Queries

```typescript
// OLD: Raw SQL
const result = await query(`
  SELECT * FROM forecast_adjustments
  WHERE user_id = $1 AND is_active = true
  ORDER BY created_at DESC
  LIMIT 50
`, [userId]);

// NEW: Drizzle
const result = await db
  .select()
  .from(forecastAdjustments)
  .where(
    and(
      eq(forecastAdjustments.userId, userId),
      eq(forecastAdjustments.isActive, true)
    )
  )
  .orderBy(desc(forecastAdjustments.createdAt))
  .limit(50);
```

#### INSERT Queries

```typescript
// OLD: Raw SQL
const result = await query(`
  INSERT INTO forecast_adjustments (
    adjustment_value, filter_context, user_id
  ) VALUES ($1, $2, $3)
  RETURNING *
`, [adjustmentValue, JSON.stringify(filterContext), userId]);

// NEW: Drizzle
const [result] = await db
  .insert(forecastAdjustments)
  .values({
    adjustmentValue: adjustmentValue.toString(),
    filterContext,
    userId,
  })
  .returning();
```

#### UPDATE Queries

```typescript
// OLD: Raw SQL
const result = await query(`
  UPDATE user_preferences
  SET has_seen_welcome = $1, updated_at = NOW()
  WHERE user_id = $2
  RETURNING *
`, [hasSeenWelcome, userId]);

// NEW: Drizzle
const [result] = await db
  .update(userPreferences)
  .set({
    hasSeenWelcome,
    updatedAt: new Date(),
  })
  .where(eq(userPreferences.userId, userId))
  .returning();
```

#### DELETE Queries

```typescript
// OLD: Raw SQL
await query(`
  DELETE FROM forecast_adjustments
  WHERE id = $1 AND user_id = $2
`, [id, userId]);

// NEW: Drizzle
await db
  .delete(forecastAdjustments)
  .where(
    and(
      eq(forecastAdjustments.id, id),
      eq(forecastAdjustments.userId, userId)
    )
  );
```

### Advanced Patterns

#### Dynamic Queries

```typescript
// OLD: Building dynamic SQL
let queryStr = 'SELECT * FROM forecast_adjustments WHERE is_active = true';
const params = [];
if (userId) {
  queryStr += ' AND user_id = $1';
  params.push(userId);
}

// NEW: Drizzle dynamic queries
let query = db
  .select()
  .from(forecastAdjustments)
  .where(eq(forecastAdjustments.isActive, true))
  .$dynamic();

if (userId) {
  query = query.where(eq(forecastAdjustments.userId, userId));
}
```

#### JSON Operations

```typescript
// OLD: JSONB queries
const result = await query(`
  SELECT * FROM forecast_adjustments
  WHERE filter_context->>'state' = $1
`, [state]);

// NEW: Drizzle with SQL template
const result = await db
  .select()
  .from(forecastAdjustments)
  .where(sql`${forecastAdjustments.filterContext}->>'state' = ${state}`);
```

#### Transactions

```typescript
// OLD: Manual transaction management
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}

// NEW: Drizzle transactions
await db.transaction(async (tx) => {
  await tx.insert(forecastAdjustments).values({...});
  await tx.update(userPreferences).set({...});
  // Automatically commits on success, rolls back on error
});
```

## Migration Strategy

### Phase 1: Parallel Implementation
1. Keep existing SQL queries in place
2. Create `.drizzle.ts` versions of API routes
3. Test both versions side-by-side

### Phase 2: Gradual Replacement
1. Replace one route at a time
2. Run tests after each replacement
3. Monitor for performance differences

### Phase 3: Cleanup
1. Remove old SQL query files
2. Update imports throughout the codebase
3. Remove the legacy postgres.ts utilities

## File Migration Checklist

### API Routes to Convert
- [ ] `/api/adjustments/route.ts` → Use `route.drizzle.ts`
- [ ] `/api/user/preferences/route.ts` → Use `route.drizzle.ts`
- [ ] `/api/user/preferences/init/route.ts`
- [ ] `/api/forecast/cache/route.ts`
- [ ] `/api/data/postgres-forecast/route.ts`
- [ ] `/api/debug/schema/route.ts`
- [ ] `/api/admin/migrate/route.ts`
- [ ] `/api/admin/run-migrations/route.ts`

### Scripts to Update
- [ ] `scripts/init-database.ts`
- [ ] `scripts/migrate-only.ts`
- [ ] `scripts/check-database-schema.ts`

## Testing

### Unit Tests
```typescript
// Test Drizzle queries match SQL results
import { db } from '@/app/db/drizzle';
import { query } from '@/app/lib/postgres';

test('Drizzle query matches SQL query', async () => {
  // SQL version
  const sqlResult = await query(
    'SELECT * FROM forecast_adjustments WHERE user_id = $1',
    [userId]
  );

  // Drizzle version
  const drizzleResult = await db
    .select()
    .from(forecastAdjustments)
    .where(eq(forecastAdjustments.userId, userId));

  expect(drizzleResult).toEqual(sqlResult.rows);
});
```

### Performance Testing
1. Log query execution times
2. Compare Drizzle vs raw SQL performance
3. Monitor connection pool usage

## Common Gotchas

1. **Decimal Types**: Drizzle returns decimals as strings
   ```typescript
   // Convert when needed
   const value = parseFloat(result.adjustmentValue);
   ```

2. **Date Handling**: Ensure consistent timezone handling
   ```typescript
   // Always use Date objects
   createdAt: new Date()
   ```

3. **JSONB Types**: TypeScript inference for JSON columns
   ```typescript
   // Define your JSON schema type
   type FilterContext = {
     dateRange: string[];
     states: string[];
     // ...
   };
   ```

4. **Table Creation**: Drizzle migrations don't include IF NOT EXISTS by default
   - Use `drizzle-kit push` for development
   - Use `drizzle-kit migrate` for production

## Resources

- [Drizzle Documentation](https://orm.drizzle.team/)
- [Query Examples](/app/db/query-examples.ts)
- [Schema Definitions](/app/db/schema/)
- [Migration Scripts](/scripts/drizzle-migrate.ts)
