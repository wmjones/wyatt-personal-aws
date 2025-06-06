# Drizzle ORM Migration Complete

## Overview

The Next.js application has been successfully migrated from using raw PostgreSQL queries to Drizzle ORM. This migration provides type safety, better developer experience, and improved maintainability.

## What Changed

### 1. Database Connection (`app/db/drizzle.ts`)
- Configured Neon serverless driver with Drizzle ORM
- Added branch-aware database connection resolution
- Support for both HTTP and pooled connections

### 2. Schema Definitions (`app/db/schema/`)
- **adjustments.ts**: Forecast adjustments table
- **forecast-cache.ts**: Cache tables for forecast data
- **forecast-data.ts**: Main forecast data table
- **user-preferences.ts**: User preferences storage
- **migrations.ts**: Legacy migration tracking (to be removed)

### 3. API Routes Migration

All API routes have been migrated to use Drizzle ORM:

#### Completed Routes:
- ✅ `/api/adjustments` - Forecast adjustments CRUD operations
- ✅ `/api/user/preferences` - User preferences management
- ✅ `/api/user/preferences/init` - Initialize user preferences
- ✅ `/api/forecast/cache` - Forecast cache operations
- ✅ `/api/debug/schema` - Database schema inspection
- ✅ `/api/data/postgres-forecast` - Forecast data queries

#### Legacy Files:
Each migrated route has a `.legacy.ts` backup file that contains the original implementation using raw SQL queries. These can be removed once the migration is fully tested.

### 4. Branch Database Support (`app/db/branch-connection.ts`)

Added automatic database connection resolution based on deployment environment:
- **Production**: Uses main database from Vercel environment variables
- **Preview**: Uses branch-specific database created by deployment workflow
- **Development**: Uses local database configuration

## Key Benefits

1. **Type Safety**: All database queries are now type-safe with TypeScript
2. **Better DX**: Auto-completion and IntelliSense for database operations
3. **Maintainability**: Schema changes are tracked through migrations
4. **Performance**: Optimized queries with proper indexing
5. **Branch Isolation**: Each preview deployment gets its own database branch

## Migration Workflow

The migration workflow (`drizzle-migrations.yml`) supports:
- Automatic migration checks on PR
- Branch-specific database creation for previews
- Migration application with retry logic
- Support for `migrate`, `push`, and `check` actions

## Environment Variables

Required environment variables:
- `DATABASE_URL`: Pooled connection string (automatically set by deployment)
- `DATABASE_URL_UNPOOLED`: Direct connection for migrations (optional)

For preview deployments, these are automatically set by the deployment workflow using the Neon branch database.

## Testing the Migration

### Debug Endpoints
- `/api/debug/env` - Check environment variables
- `/api/debug/schema` - Inspect database schema
- `/api/debug/db-connection` - Verify database connection

### Verify Branch Database
```bash
# Check which database is being used
curl https://your-preview-url.vercel.app/api/debug/db-connection
```

## Next Steps

1. **Testing**: Thoroughly test all API routes with Drizzle ORM
2. **Performance**: Monitor query performance and optimize as needed
3. **Cleanup**: Remove legacy `.legacy.ts` files after verification
4. **Documentation**: Update API documentation with new query patterns

## Common Patterns

### Simple Query
```typescript
// Before (raw SQL)
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

// After (Drizzle)
const result = await db.select().from(users).where(eq(users.id, userId));
```

### Insert with Conflict
```typescript
// Before
await query(`
  INSERT INTO preferences (user_id, settings)
  VALUES ($1, $2)
  ON CONFLICT (user_id) DO UPDATE
  SET settings = EXCLUDED.settings
`, [userId, settings]);

// After
await db
  .insert(preferences)
  .values({ userId, settings })
  .onConflictDoUpdate({
    target: preferences.userId,
    set: { settings }
  });
```

### Transaction
```typescript
// Before
await db.transaction(async (client) => {
  await client.query('UPDATE ...');
  await client.query('INSERT ...');
});

// After
await db.transaction(async (tx) => {
  await tx.update(table1).set(...);
  await tx.insert(table2).values(...);
});
```

## Troubleshooting

### Connection Issues
1. Check `/api/debug/db-connection` endpoint
2. Verify environment variables are set
3. Check branch database status in Neon console

### Migration Errors
1. Use workflow dispatch with `action: check` to see migration status
2. Check for pending migrations in `drizzle/` directory
3. Verify database schema matches expected structure

### Type Errors
1. Regenerate types: `npm run drizzle:generate`
2. Check schema definitions match database
3. Ensure all imports use the schema index file
