# Fix: Neon Branch Creation for Dev and Production Deployments

## Problem Statement

The Vercel deployment workflow was failing for dev and production branches due to missing `DATABASE_URL` and `DATABASE_URL_UNPOOLED` environment variables. Preview deployments worked correctly because they created Neon branches dynamically and used step outputs, but dev and prod deployments relied on hardcoded environment variables that were not available.

## Root Cause Analysis

1. **Preview deployments**: ✅ Create Neon branches → Use step outputs for DATABASE_URL
2. **Dev deployments**: ❌ Used hardcoded environment variables (missing)
3. **Production deployments**: ❌ Used hardcoded environment variables (missing)

## Solution Implemented

### 1. Consistent Neon Branch Creation
Updated the workflow to create Neon database branches for ALL deployment types:

```yaml
# Create Neon Branch for dev and production deployments
- name: Create Neon Branch
  if: github.ref == matrix.ref
  id: create_neon_branch
  timeout-minutes: 5
  uses: neondatabase/create-branch-action@v5
  with:
    project_id: ${{ vars.NEON_PROJECT_ID }}
    branch_name: ${{ matrix.branch }}-deployment-${{ github.sha }}
    api_key: ${{ secrets.NEON_API_KEY }}
    username: neondb_owner
```

### 2. Dynamic Database URL Provisioning
All deployments now use step outputs instead of hardcoded environment variables:

```yaml
# Build with dynamic database URLs
env:
  DATABASE_URL: ${{ steps.create_neon_branch.outputs.db_url_with_pooler }}
  DATABASE_URL_UNPOOLED: ${{ steps.create_neon_branch.outputs.db_url }}

# Deploy with dynamic database URLs
DEPLOYMENT_URL=$(npx vercel deploy --prebuilt ${{ matrix.prod_flag }} --token=${{ secrets.VERCEL_TOKEN }} \
  --env DATABASE_URL="${{ steps.create_neon_branch.outputs.db_url_with_pooler }}" \
  --env DATABASE_URL_UNPOOLED="${{ steps.create_neon_branch.outputs.db_url }}")
```

### 3. Database Migrations for All Environments
Added database migration step for dev and production deployments:

```yaml
- name: Run Database Migrations
  working-directory: src/frontend/nextjs-app
  timeout-minutes: 10
  run: npx tsx scripts/init-database.ts
  env:
    DATABASE_URL: ${{ steps.create_neon_branch.outputs.db_url_with_pooler }}
    DATABASE_URL_UNPOOLED: ${{ steps.create_neon_branch.outputs.db_url }}
    NODE_ENV: ${{ matrix.branch == 'main' && 'production' || 'development' }}
```

### 4. Branch Naming Strategy
- **Preview**: `preview/pr-{number}-{branch-name}` (temporary, auto-cleanup)
- **Dev**: `dev-deployment-{commit-sha}` (persistent)
- **Production**: `main-deployment-{commit-sha}` (persistent)

### 5. Additional Improvements
- **Node.js 22**: Updated all deployments to use Node.js 22 consistently
- **NPX Vercel CLI**: Use npm package version instead of global installation
- **Enhanced Logging**: Better deployment summaries with database branch info
- **Cleanup Placeholder**: Added structure for future branch cleanup implementation

## Benefits

1. **Consistent Environment Variables**: All deployments have DATABASE_URL available
2. **Isolation**: Each deployment gets its own database branch
3. **Database Migrations**: Automatic schema updates for all environments
4. **Reliability**: No more hardcoded environment variable dependencies
5. **Transparency**: Clear database branch tracking in deployment summaries

## Files Modified

- `.github/workflows/nextjs-deploy-with-neon.yml`: Complete workflow overhaul
- Added comprehensive documentation comments

## Testing Strategy

1. **Dev Branch Push**: Should create `dev-deployment-{sha}` branch and deploy successfully
2. **Main Branch Push**: Should create `main-deployment-{sha}` branch and deploy successfully
3. **Pull Request**: Should continue working as before with preview branches
4. **Environment Variables**: All deployments should have DATABASE_URL and DATABASE_URL_UNPOOLED

## Migration Notes

This change ensures that:
- Dev and production deployments will no longer fail due to missing DATABASE_URL
- All environments follow the same reliable pattern as preview deployments
- Database branches are properly isolated per deployment
- Schema migrations are consistently applied across all environments

## Future Enhancements

1. Implement branch cleanup to prevent accumulation of old deployment branches
2. Add branch tagging for better organization
3. Consider implementing branch reset strategies for dev environment
4. Add database branch monitoring and alerts
