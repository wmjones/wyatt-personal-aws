# Drizzle ORM Migration Rollback Plan

This document outlines the rollback procedures and safety mechanisms for the Drizzle ORM migration.

## Table of Contents
1. [Pre-Migration Safety Checks](#pre-migration-safety-checks)
2. [Backup Procedures](#backup-procedures)
3. [Rollback Strategies](#rollback-strategies)
4. [Emergency Procedures](#emergency-procedures)
5. [Testing the Rollback](#testing-the-rollback)

## Pre-Migration Safety Checks

### 1. Database Backup
Before any migration:
```bash
# Create a Neon branch for backup
neon branches create --name pre-drizzle-backup-$(date +%Y%m%d-%H%M%S)

# Or use pg_dump for external backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

### 2. Schema Snapshot
```bash
# Save current schema
pg_dump --schema-only $DATABASE_URL > schema-backup-$(date +%Y%m%d-%H%M%S).sql

# Save table row counts
psql $DATABASE_URL -c "
SELECT schemaname, tablename, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;" > row-counts-$(date +%Y%m%d-%H%M%S).txt
```

### 3. Application State
```bash
# Tag the current release
git tag pre-drizzle-migration-$(date +%Y%m%d-%H%M%S)
git push origin --tags

# Note current Vercel deployment
vercel ls --json > vercel-deployments-backup.json
```

## Backup Procedures

### Automated Backup Script
Create `scripts/backup-before-migration.sh`:

```bash
#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backups/drizzle-migration-$TIMESTAMP"

echo "🔒 Creating backup directory: $BACKUP_DIR"
mkdir -p $BACKUP_DIR

echo "📸 Creating Neon branch backup..."
BRANCH_ID=$(neon branches create \
  --name "backup-$TIMESTAMP" \
  --compute \
  --output json | jq -r '.id')

echo "{\"branch_id\": \"$BRANCH_ID\", \"timestamp\": \"$TIMESTAMP\"}" > $BACKUP_DIR/neon-branch.json

echo "💾 Backing up database schema..."
pg_dump --schema-only $DATABASE_URL > $BACKUP_DIR/schema.sql

echo "📊 Backing up row counts..."
psql $DATABASE_URL -c "
SELECT schemaname, tablename, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;" > $BACKUP_DIR/row-counts.txt

echo "🏷️  Creating git tag..."
git tag "backup-$TIMESTAMP"

echo "✅ Backup completed: $BACKUP_DIR"
```

## Rollback Strategies

### Strategy 1: Revert Code Changes
For issues with application code:

```bash
# Revert to previous git tag
git checkout pre-drizzle-migration-[timestamp]

# Deploy previous version
git push origin main --force-with-lease

# Or use Vercel instant rollback
vercel rollback [deployment-url]
```

### Strategy 2: Revert Schema Changes
For database schema issues:

```sql
-- Restore from Neon branch
-- 1. Get branch ID from backup
-- 2. Switch application to use backup branch
-- 3. Create new branch from backup for continued development

-- Or manually revert migrations
-- This would need custom down migrations (not built into Drizzle)
```

### Strategy 3: Parallel Running
Keep both systems running temporarily:

```typescript
// In your API routes
const USE_DRIZZLE = process.env.USE_DRIZZLE === 'true';

if (USE_DRIZZLE) {
  // Use Drizzle queries
  const result = await db.select().from(table);
} else {
  // Use legacy queries
  const result = await query('SELECT * FROM table');
}
```

## Emergency Procedures

### 1. Immediate Rollback Script
Create `scripts/emergency-rollback.sh`:

```bash
#!/bin/bash
set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED"

# 1. Switch to backup database
echo "Switching to backup database..."
vercel env rm DATABASE_URL --yes
vercel env add DATABASE_URL < backup-database-url.txt

# 2. Rollback Vercel deployment
echo "Rolling back Vercel deployment..."
PREVIOUS_DEPLOYMENT=$(vercel ls --json | jq -r '.[1].url')
vercel rollback $PREVIOUS_DEPLOYMENT --yes

# 3. Alert team
echo "Sending alerts..."
# Add your alerting mechanism here

echo "✅ Emergency rollback completed"
```

### 2. Data Integrity Checks
Create `scripts/verify-data-integrity.ts`:

```typescript
import { db } from '../app/db/drizzle';
import { query } from '../app/lib/postgres';

async function verifyDataIntegrity() {
  const checks = [
    // Check row counts
    async () => {
      const drizzleCount = await db.select({ count: sql`count(*)` }).from(forecastAdjustments);
      const sqlCount = await query('SELECT COUNT(*) FROM forecast_adjustments');

      if (drizzleCount[0].count !== sqlCount.rows[0].count) {
        throw new Error('Row count mismatch in forecast_adjustments');
      }
    },

    // Check data consistency
    async () => {
      const sampleData = await db.select().from(forecastAdjustments).limit(10);
      // Verify data structure and values
    },

    // Check critical business logic
    async () => {
      // Test critical queries work correctly
    }
  ];

  for (const check of checks) {
    await check();
  }

  console.log('✅ All integrity checks passed');
}
```

### 3. Monitoring and Alerts

Set up monitoring for:
- Error rates in application logs
- Database query performance
- User-reported issues
- API response times

## Testing the Rollback

### 1. Rollback Drill
Before production migration:

```bash
# 1. Deploy to staging
# 2. Run migrations
# 3. Verify everything works
# 4. Execute rollback procedure
# 5. Verify rollback success
# 6. Document any issues
```

### 2. Partial Rollback Test
Test rolling back specific components:

```bash
# Test database rollback only
# Test code rollback only
# Test feature flag disable
```

### 3. Load Testing
Ensure rollback works under load:

```bash
# Run load test during rollback
# Monitor for data corruption
# Check for race conditions
```

## Rollback Decision Matrix

| Issue Type | Severity | Rollback Strategy | Time to Execute |
|-----------|----------|-------------------|-----------------|
| Query errors | High | Code revert | 5 minutes |
| Schema mismatch | High | Neon branch swap | 10 minutes |
| Performance degradation | Medium | Feature flag | 1 minute |
| Data corruption | Critical | Full rollback | 15 minutes |
| Partial feature failure | Low | Feature flag | 1 minute |

## Post-Rollback Checklist

- [ ] Verify all services are operational
- [ ] Check data integrity
- [ ] Review error logs
- [ ] Notify stakeholders
- [ ] Document lessons learned
- [ ] Plan fixes for issues
- [ ] Schedule retry

## Communication Plan

### During Rollback
```
Subject: [URGENT] Database Migration Rollback in Progress

We are rolling back the Drizzle ORM migration due to [issue].
Expected completion: [time]
Impact: [description]

Updates will be provided every 15 minutes.
```

### After Rollback
```
Subject: Database Migration Rollback Complete

The rollback has been completed successfully.
All services are operational.
Root cause analysis to follow.
```

## Lessons Learned Template

After any rollback, document:
1. What went wrong?
2. How was it detected?
3. What was the impact?
4. How long did rollback take?
5. What could prevent this in future?
6. Action items for improvement
