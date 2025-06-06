#!/bin/bash

# Drizzle migrations for Vercel deployments
# This script runs during the Vercel build process

set -e  # Exit on error

echo "🚀 Starting Drizzle migration check for Vercel deployment..."

# Check if we're in a Vercel environment
if [ -z "$VERCEL" ]; then
  echo "⚠️  Not running in Vercel environment, skipping migrations"
  exit 0
fi

# Determine the environment based on Vercel environment variables
if [ "$VERCEL_ENV" = "production" ]; then
  MIGRATION_ENV="prod"
elif [ "$VERCEL_ENV" = "preview" ]; then
  # For preview deployments, check the branch
  if [ "$VERCEL_GIT_COMMIT_REF" = "dev" ]; then
    MIGRATION_ENV="dev"
  else
    # Feature branches use dev database but don't run migrations
    echo "ℹ️  Feature branch deployment - skipping migrations"
    exit 0
  fi
else
  echo "ℹ️  Development deployment - skipping migrations"
  exit 0
fi

echo "📊 Environment detected: $MIGRATION_ENV"
echo "   - Vercel Environment: $VERCEL_ENV"
echo "   - Git Branch: $VERCEL_GIT_COMMIT_REF"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set!"
  echo "   Please ensure DATABASE_URL is configured in Vercel environment variables"
  exit 1
fi

# Mask the database URL in logs
MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^@]*@/:****@/')
echo "   - Database URL: $MASKED_URL"

# Generate migrations (in case they weren't committed)
echo ""
echo "🔍 Checking for pending migrations..."
npm run drizzle:generate

# Check if there are any uncommitted migrations
if [ -n "$(git status --porcelain drizzle/)" ]; then
  echo "⚠️  Warning: Uncommitted migration files detected"
  echo "   This might indicate schema changes that weren't committed"
  git status --porcelain drizzle/
fi

# Run migrations based on environment
if [ "$MIGRATION_ENV" = "prod" ]; then
  echo ""
  echo "🚨 PRODUCTION DEPLOYMENT DETECTED"
  echo "   Migrations will be applied to the production database"

  # For production, we use the migrate command (applies migrations)
  echo "🔄 Running production migrations..."
  npm run drizzle:migrate:run

elif [ "$MIGRATION_ENV" = "dev" ]; then
  echo ""
  echo "📝 Development/Preview deployment detected"
  echo "   Using push command for rapid iteration"

  # For dev, we use push (direct schema sync)
  echo "🔄 Pushing schema changes..."
  npm run drizzle:push
fi

echo ""
echo "✅ Database migration process completed successfully!"
echo "   Continuing with Vercel build..."
