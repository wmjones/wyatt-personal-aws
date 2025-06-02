#!/bin/bash
# Example script showing how to use the manual ETL workflow

# Example 1: Full sync to main branch
echo "Example 1: Full data sync to main branch"
gh workflow run athena-to-neon-manual-etl.yml \
  -f data_mode=full \
  -f date_range_days=0

# Example 2: Last 30 days to a feature branch
echo "Example 2: Sync last 30 days to feature branch"
gh workflow run athena-to-neon-manual-etl.yml \
  -f target_branch=feature/dashboard-v2 \
  -f data_mode=full \
  -f date_range_days=30

# Example 3: Schema only for development
echo "Example 3: Schema-only sync for development"
gh workflow run athena-to-neon-manual-etl.yml \
  -f target_branch=dev-john-doe \
  -f data_mode=schema-only

# Example 4: Test data for isolated testing
echo "Example 4: Generate test data for testing"
gh workflow run athena-to-neon-manual-etl.yml \
  -f target_branch=test-integration \
  -f data_mode=test-data

# Example 5: Specific states with date range
echo "Example 5: Sync specific states for last 7 days"
gh workflow run athena-to-neon-manual-etl.yml \
  -f target_branch=preview/pr-123 \
  -f data_mode=full \
  -f table_filter=CA,TX,FL \
  -f date_range_days=7

# Check workflow status
echo "Check workflow runs:"
gh run list --workflow=athena-to-neon-manual-etl.yml --limit 5
