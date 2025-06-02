#!/bin/bash

# Script to run database migrations via the Vercel deployment API endpoint

VERCEL_URL="https://nextjs-9zx686erh-wyatts-projects-eccf22ae.vercel.app"
MIGRATION_SECRET="dev-secret"

echo "Running database migrations on production..."

# Check migration status first
echo "Checking current migration status..."
curl -X GET "${VERCEL_URL}/api/admin/migrate" \
  -H "Authorization: Bearer ${MIGRATION_SECRET}" \
  -H "Content-Type: application/json"

echo -e "\n\nRunning migrations..."

# Run migrations
curl -X POST "${VERCEL_URL}/api/admin/migrate" \
  -H "Authorization: Bearer ${MIGRATION_SECRET}" \
  -H "Content-Type: application/json"

echo -e "\n\nMigrations completed!"
