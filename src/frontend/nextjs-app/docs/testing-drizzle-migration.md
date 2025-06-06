# Testing the Drizzle ORM Migration

This guide provides instructions for testing the completed Drizzle ORM migration.

## Prerequisites

1. Local development environment set up
2. Access to preview deployments on Vercel
3. Database credentials configured

## Testing Steps

### 1. Local Testing

First, test the API routes locally:

```bash
# Start the development server
npm run dev

# In another terminal, run the API test suite
npm run test:api

# Or test specific endpoints
npm run test:api -- --base-url=http://localhost:3000
```

Expected output:
- All endpoints should return 200 OK
- Database connection should be successful
- No TypeScript or runtime errors

### 2. Preview Deployment Testing

Deploy to a preview branch and test:

```bash
# Push to a feature branch
git push origin feature/your-branch

# Wait for Vercel deployment to complete
# Then test the preview URL
npm run test:api -- --base-url=https://your-preview-url.vercel.app
```

### 3. Branch Database Verification

Verify that preview deployments use their own database branch:

```bash
# Test branch database isolation
npm run test:branch-db -- --url=https://your-preview-url.vercel.app
```

This script will:
- Verify the deployment is using a branch database
- Create test data in the branch database
- Confirm data isolation from production

### 4. Performance Testing

Compare performance before and after migration:

```bash
# Run performance tests
npm run test:drizzle-perf
```

## Manual Testing Checklist

### Debug Endpoints

Test these endpoints manually to verify configuration:

1. **Environment Check**: `/api/debug/env`
   - Verify DATABASE_URL is set
   - Check VERCEL_ENV matches expectations

2. **Database Connection**: `/api/debug/db-connection`
   - Confirm connection status is "connected"
   - Verify correct environment (production/preview/development)
   - Check branch name for preview deployments

3. **Schema Inspection**: `/api/debug/schema`
   - Verify Drizzle migrations table exists
   - Check forecast_adjustments table structure

### Feature Testing

Test each feature that uses the database:

1. **User Preferences**
   - Initialize preferences for a new user
   - Update preference settings
   - Retrieve saved preferences

2. **Forecast Adjustments**
   - Create a new adjustment
   - List all adjustments
   - Update an existing adjustment
   - Delete an adjustment

3. **Forecast Cache**
   - View cache statistics
   - Verify cache hit/miss tracking
   - Test cache expiration

4. **Forecast Data**
   - Query forecast data with filters
   - Get distinct values for dropdowns
   - Test aggregation queries

## Troubleshooting

### Common Issues

1. **"DATABASE_URL is not defined" error**
   - Check `.env.local` for local development
   - Verify Vercel environment variables for deployments
   - Ensure deployment workflow passed database URLs

2. **"Cannot connect to database" error**
   - Check `/api/debug/db-connection` for details
   - Verify Neon branch is active
   - Check for SSL/TLS configuration issues

3. **Type errors after migration**
   - Run `npm run drizzle:generate` to update types
   - Ensure all imports use the new schema files
   - Check for any remaining imports from `lib/postgres`

### Debugging Commands

```bash
# Check for legacy imports
grep -r "from.*postgres" src/frontend/nextjs-app --include="*.ts" --include="*.tsx"

# Find .legacy.ts files
find src/frontend/nextjs-app -name "*.legacy.ts"

# Dry run cleanup to see what would be removed
npm run cleanup:legacy -- --dry-run
```

## Cleanup Process

Once testing is complete and you're confident in the migration:

1. **Remove Legacy Code**
   ```bash
   # First, do a dry run
   npm run cleanup:legacy -- --dry-run

   # If everything looks good, run the cleanup
   npm run cleanup:legacy
   ```

2. **Update Dependencies**
   - Remove `pg` and `@types/pg` if no longer needed
   - Update any database-related documentation

3. **Final Testing**
   - Run all tests again after cleanup
   - Deploy to preview and production
   - Monitor for any issues

## Success Criteria

The migration is considered successful when:

✅ All API routes work without errors
✅ Preview deployments use isolated branch databases
✅ Performance is equal or better than before
✅ No TypeScript errors related to database operations
✅ All tests pass in CI/CD pipeline
✅ Legacy code has been removed

## Rollback Plan

If issues are discovered:

1. The `.legacy.ts` files contain the original implementations
2. Rename files back: `mv route.ts route.drizzle.ts && mv route.legacy.ts route.ts`
3. Revert the drizzle.ts changes to use `process.env.DATABASE_URL` directly
4. Fix any issues before attempting migration again
