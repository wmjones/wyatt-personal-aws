#!/bin/bash
# Script to run ETL to feature branch

cd /workspaces/wyatt-personal-aws/src/frontend/nextjs-app

echo "Starting ETL to feature branch..."
echo "Target branch: br-green-sea-a5k2tb5a (preview/pr-228-feature/demand-planning-performance-optimizations)"

# Run the ETL with feature branch connection
nohup npx tsx scripts/athena-to-neon-etl.ts > etl-feature-branch.log 2>&1 &

echo "ETL process started in background."
echo "Monitor progress with: tail -f etl-feature-branch.log | grep 'Total:'"
