# Drizzle ORM Merge Conflicts Documentation

Date: 2025-06-06
Branch: feature/adjustment-ui-improvements merging from origin/dev

## Conflict Categories

### Database Configuration Files
- [x] No conflicts - all new Drizzle files accepted

### Schema Files
- [x] New Drizzle schema files added (no conflicts)
- [x] **COMPLETED**: Added adjustment_start_date and adjustment_end_date columns to adjustments.ts
- [x] **COMPLETED**: Added date range index to adjustments.ts
- [x] **COMPLETED**: Added DATABASE_URL validation to drizzle.config.ts

### API Routes
- [x] src/frontend/nextjs-app/app/api/adjustments/route.ts - Auto-merged (has comment about Drizzle version)
- [x] New route.drizzle.ts files added

### Migration Files
- [x] src/frontend/nextjs-app/app/lib/migrations.ts - DELETED in dev, MODIFIED in current branch
- [x] Old admin migration routes deleted

### Other Files
- [x] package.json, package-lock.json - auto-merged
- [x] pre-commit-config.yaml - auto-merged

## Resolution Strategy

1. **Accept Drizzle Implementation** - For all database configuration and new Drizzle files
2. **Preserve adjustment_start_date and adjustment_end_date** - Ensure these columns from migration 006 are added to Drizzle schema
3. **Remove Old Migration System** - Accept deletion of old migration files
4. **Update API Routes** - Use Drizzle versions where available

## Conflicts Detail

### migrations.ts Conflict
- **Status**: File deleted in dev (Drizzle replaces it), modified in current branch (added migration 006)
- **Resolution**: Accept deletion, but ensure migration 006 columns are in Drizzle schema
- **Required Action**: Add adjustment_start_date and adjustment_end_date to forecastAdjustments table in Drizzle schema
