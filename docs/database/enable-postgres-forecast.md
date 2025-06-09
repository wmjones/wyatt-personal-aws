# Postgres-Only Forecast Architecture

## Overview

The application has been refactored to use Postgres/Neon exclusively for forecast data queries. Athena is no longer used directly by the Next.js application, resulting in significant performance improvements.

## Performance Benefits

- **Previous (Athena)**: 30+ seconds for loading all locations
- **Current (Postgres)**: ~2-3 seconds for the same query

## Architecture Changes

### Before:
```
Next.js App → Athena Service → AWS Athena → S3 Data Lake
```

### Now:
```
Next.js App → Postgres Service → Neon Database
Athena → ETL Process → Neon Database (separate data pipeline)
```

## Implementation Details

### 1. Run the Migration Script (One-time Setup)

The forecast data needs to be migrated from Athena to Postgres:

```bash
cd src/frontend/nextjs-app
npm run migrate:forecast
```

**Note**: The migration script (`scripts/migrate-forecast-to-postgres.ts`) requires AWS credentials with Athena access.

### 2. Database Structure

The Postgres database includes:
- `forecast_data` table with optimized indexes
- `forecast_summary` materialized view for aggregations
- Indexes on commonly queried columns (state, inventory_item_id, business_date)

### 3. Removed Components

- `athenaService.ts` - No longer needed
- `/api/data/athena` route - Removed
- Feature flag `NEXT_PUBLIC_USE_POSTGRES_FORECAST` - No longer needed

## Data Flow

1. **Data Pipeline**: Athena continues to process raw data from S3
2. **ETL Process**: Scheduled job migrates data from Athena to Postgres
3. **Application**: Next.js queries Postgres directly for all forecast data

## Monitoring

The application logs will show which service is being used:
- Look for `[AthenaService]` logs when using Athena
- Look for `[PostgresForecastService]` logs when using Postgres

## Next Steps

1. Add the environment variable to Vercel
2. Redeploy the application
3. Monitor the performance improvement
