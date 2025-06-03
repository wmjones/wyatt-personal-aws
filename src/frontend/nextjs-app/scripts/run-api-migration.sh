#!/bin/bash

# Script to run migrations via the API route

# Get the auth token (you'll need to provide this)
if [ -z "$AUTH_TOKEN" ]; then
  echo "Please set AUTH_TOKEN environment variable with a valid JWT token"
  echo "You can get this from the browser's developer tools after logging in"
  exit 1
fi

# First check migration status
echo "Checking migration status..."
curl -H "Authorization: Bearer $AUTH_TOKEN" \
  http://localhost:3000/api/admin/run-migrations

echo -e "\n\nRunning migrations..."
# Run migrations
curl -X POST -H "Authorization: Bearer $AUTH_TOKEN" \
  http://localhost:3000/api/admin/run-migrations

echo -e "\n\nMigration complete!"
