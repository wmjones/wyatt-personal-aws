#!/bin/bash
cd /workspaces/wyatt-personal-aws/src/frontend/nextjs-app
echo "Starting ETL process at $(date)"
npx tsx scripts/athena-to-neon-etl.ts 2>&1 | tee etl-migration.log
echo "ETL process completed at $(date) with exit code: $?"
