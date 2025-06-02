#!/bin/bash
# Script to continue ETL migration with the fixed pagination

cd /workspaces/wyatt-personal-aws/src/frontend/nextjs-app

echo "Checking current migration status..."
CURRENT_COUNT=$(echo "SELECT COUNT(*) FROM forecast_data" | psql postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-snowy-dust-a5rl14da-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require -t)
echo "Current records in Neon: $CURRENT_COUNT"

echo "Starting continued ETL process..."
nohup npx tsx scripts/athena-to-neon-etl.ts > etl-migration-continued.log 2>&1 &
echo "ETL process started in background. Check etl-migration-continued.log for progress."
