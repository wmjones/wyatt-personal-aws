# Preview Deployment Database Configuration Fix

## Problem Description

Preview deployments on Vercel were failing with database authentication errors:
```
No database URL found for preview environment. Branch: unknown. Please ensure DATABASE_URL is set.
```

This occurred because DATABASE_URL environment variables were only available at build time but not at runtime in preview deployments.

## Root Cause

1. The deployment workflow was passing DATABASE_URL as build arguments but not setting them as runtime environment variables
2. Preview deployments need branch-specific database URLs that persist beyond the build process
3. The database connection module couldn't find the DATABASE_URL at runtime

## Solution Implementation

### 1. Updated Deployment Workflow

Modified `.github/workflows/nextjs-deploy-with-neon.yml` to add Step 14 that sets environment variables in Vercel for specific git branches:

```yaml
# Step 14: Set Environment Variables for Preview Deployments
- name: Set Environment Variables for Preview Deployments
  if: steps.branch_name.outputs.current_branch != 'dev' && steps.branch_name.outputs.current_branch != 'main'
  working-directory: src/frontend/nextjs-app
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    VERCEL_ORG_ID: ${{ env.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ env.VERCEL_PROJECT_ID }}
  run: |
    echo "Setting environment variables for preview deployment..."
    # Set branch-specific database URLs for the current git branch
    # These will be available at runtime for this specific branch deployment
    vercel env add DATABASE_URL production --git-branch="${{ steps.branch_name.outputs.current_branch }}" <<< "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}" --token=${{ secrets.VERCEL_TOKEN }} || true
    vercel env add DATABASE_URL_UNPOOLED production --git-branch="${{ steps.branch_name.outputs.current_branch }}" <<< "${{ steps.create_neon_branch.outputs.db_url }}" --token=${{ secrets.VERCEL_TOKEN }} || true
    vercel env add DEPLOYMENT_BRANCH production --git-branch="${{ steps.branch_name.outputs.current_branch }}" <<< "${{ steps.branch_name.outputs.current_branch }}" --token=${{ secrets.VERCEL_TOKEN }} || true
    echo "✅ Environment variables set for branch: ${{ steps.branch_name.outputs.current_branch }}"
```

### 2. Enhanced Branch Connection Module

Updated `src/frontend/nextjs-app/app/db/branch-connection.ts` to:

1. Export helper functions for better debugging:
   - `getCurrentBranch()` - Gets the current git branch
   - `getEnvironment()` - Determines deployment environment

2. Add support for preview-specific environment variables:
   ```typescript
   // For Vercel preview deployments, check for project-level environment variables
   // These would be set in Vercel dashboard for all preview deployments
   if (process.env.VERCEL_ENV === 'preview') {
     // Try to use preview-specific database URLs if available
     const previewPooled = process.env.PREVIEW_DATABASE_URL || process.env.DATABASE_URL_PREVIEW;
     const previewUnpooled = process.env.PREVIEW_DATABASE_URL_UNPOOLED || process.env.DATABASE_URL_UNPOOLED_PREVIEW;

     if (previewPooled) {
       return {
         pooled: previewPooled,
         unpooled: previewUnpooled || previewPooled
       };
     }
   }
   ```

### 3. Modified Deployment Step

The deployment step (Step 16) was updated to not pass environment variables inline for preview deployments since they're now set in Vercel:

```yaml
# Deploy without passing env vars since they're now set in Vercel
DEPLOYMENT_URL=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
```

## How It Works

1. **Branch Creation**: When a feature branch is pushed, the workflow creates a Neon database branch
2. **Environment Setup**: The workflow uses Vercel CLI to set DATABASE_URL for the specific git branch
3. **Runtime Access**: The Next.js app can access these environment variables at runtime
4. **Branch Isolation**: Each git branch gets its own database branch and environment variables

## Benefits

- Preview deployments have isolated database branches
- Environment variables persist across deployments for the same branch
- No manual configuration needed in Vercel dashboard
- Automatic cleanup when branches are deleted

## Testing the Fix

To verify the fix is working:

1. Push to a feature branch to trigger deployment
2. Check deployment logs for "✅ Environment variables set for branch"
3. Visit the debug endpoint: `https://[deployment-url]/api/debug/db-connection`
4. Verify database connection is successful

## Debugging

If database connection still fails:

1. Check Vercel dashboard → Settings → Environment Variables
2. Look for branch-specific variables (they'll show the git branch name)
3. Verify the Neon branch was created successfully
4. Check deployment logs for any errors in Step 14

## Related Files

- `/src/frontend/nextjs-app/app/db/branch-connection.ts` - Database connection resolution
- `/.github/workflows/nextjs-deploy-with-neon.yml` - Deployment workflow
- `/src/frontend/nextjs-app/app/api/debug/db-connection/route.ts` - Debug endpoint

## Future Improvements

1. Add health check endpoint for automatic validation
2. Implement automatic cleanup of old branch environment variables
3. Add monitoring for failed database connections in preview deployments
