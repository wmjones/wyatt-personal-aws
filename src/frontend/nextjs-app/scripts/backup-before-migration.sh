#!/bin/bash
set -e

# Backup script for Drizzle migration
# Creates comprehensive backups before running migrations

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backups/drizzle-migration-$TIMESTAMP"

echo "🔒 Drizzle Migration Backup Script"
echo "================================="
echo "Timestamp: $TIMESTAMP"
echo ""

# Create backup directory
echo "📁 Creating backup directory: $BACKUP_DIR"
mkdir -p $BACKUP_DIR

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  exit 1
fi

# Mask database URL in output
MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^@]*@/:****@/')
echo "🔗 Database: $MASKED_URL"
echo ""

# Backup database schema
echo "💾 Backing up database schema..."
if pg_dump --schema-only "$DATABASE_URL" > "$BACKUP_DIR/schema.sql" 2>"$BACKUP_DIR/schema-backup.log"; then
  echo "   ✅ Schema backup completed"
else
  echo "   ❌ Schema backup failed. Check $BACKUP_DIR/schema-backup.log"
  exit 1
fi

# Get row counts for all tables
echo "📊 Backing up table statistics..."
psql "$DATABASE_URL" -t -A -F"," -c "
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_stat_user_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n_live_tup DESC;" > "$BACKUP_DIR/table-stats.csv" 2>"$BACKUP_DIR/stats-backup.log"

if [ $? -eq 0 ]; then
  echo "   ✅ Table statistics backed up"
else
  echo "   ⚠️  Table statistics backup had issues. Check $BACKUP_DIR/stats-backup.log"
fi

# Backup current migrations status
echo "📋 Backing up migration status..."
psql "$DATABASE_URL" -c "
SELECT * FROM migrations ORDER BY applied_at;" > "$BACKUP_DIR/migrations-status.txt" 2>/dev/null || echo "   ℹ️  No existing migrations table"

# Create metadata file
echo "📝 Creating backup metadata..."
cat > "$BACKUP_DIR/metadata.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "backup_dir": "$BACKUP_DIR",
  "database_url_masked": "$MASKED_URL",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD)",
  "node_version": "$(node --version)",
  "created_by": "$(whoami)",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# Create restore instructions
echo "📄 Creating restore instructions..."
cat > "$BACKUP_DIR/RESTORE.md" << 'EOF'
# Database Restore Instructions

## Quick Restore

1. **Restore schema only:**
   ```bash
   psql $DATABASE_URL < schema.sql
   ```

2. **Check table statistics:**
   ```bash
   cat table-stats.csv
   ```

## Full Restore Process

1. Create a new database or Neon branch
2. Restore the schema
3. Restore data from your data backups
4. Verify row counts match table-stats.csv

## Emergency Contact

If you need help with restoration:
- Check the rollback plan in docs/drizzle-rollback-plan.md
- Contact the DevOps team
EOF

# Git tag for code backup
echo "🏷️  Creating git tag..."
GIT_TAG="backup-drizzle-$TIMESTAMP"
if git tag -a "$GIT_TAG" -m "Backup before Drizzle migration - $TIMESTAMP"; then
  echo "   ✅ Git tag created: $GIT_TAG"
  echo "   ℹ️  Push with: git push origin $GIT_TAG"
else
  echo "   ⚠️  Git tag creation failed"
fi

# Summary
echo ""
echo "✅ Backup completed successfully!"
echo "================================="
echo "📁 Backup location: $BACKUP_DIR"
echo "📋 Contents:"
echo "   - schema.sql: Complete database schema"
echo "   - table-stats.csv: Row counts and sizes"
echo "   - metadata.json: Backup metadata"
echo "   - RESTORE.md: Restoration instructions"
echo ""
echo "🏷️  Git tag: $GIT_TAG"
echo ""
echo "⚠️  IMPORTANT: This backup contains schema only, not data!"
echo "   For full data backup, use your database provider's backup features."
