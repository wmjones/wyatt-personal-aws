# Vercel Dev Branch Production Deployment Strategy

## Overview

This document explains the new deployment strategy that treats the `dev` branch as a production-like environment in Vercel, with automatic cleanup of preview deployments when branches are merged or deleted.

## Problem Solved

**Before:**
- All branches (including dev) created preview deployments
- Preview deployments accumulated without cleanup
- Dev branch changes didn't update the main dev environment
- Manual cleanup was required for old deployments

**After:**
- Dev branch deploys as production (replaces previous dev deployment)
- Feature branches create preview deployments
- Automatic cleanup when branches are merged/deleted
- Clear separation between production and preview environments

## Deployment Strategy

### Production Deployments
- **main branch** → Production deployment (main app)
- **dev branch** → Production deployment (dev environment)

### Preview Deployments
- **feature/** branches → Preview deployments with branch-specific URLs
- **bugfix/** branches → Preview deployments with branch-specific URLs
- **hotfix/** branches → Preview deployments with branch-specific URLs

## Workflow Changes Made

### 1. Branch-Specific Deployment Logic

```yaml
# In .github/workflows/nextjs-deploy-with-neon.yml
if [ "$branch" = "dev" ] || [ "$branch" = "main" ]; then
  # Deploy as production (replaces previous deployment)
  vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
else
  # Deploy as preview with branch-specific alias
  vercel deploy --prebuilt --token=$VERCEL_TOKEN
  vercel alias set $DEPLOYMENT_URL $ALIAS --token=$VERCEL_TOKEN
fi
```

### 2. Automatic Cleanup on PR Close

**Triggers:**
- When PR is closed (merged or not merged)
- When branch is deleted

**Cleanup Actions:**
1. Delete Neon database branch
2. Remove Vercel preview deployments
3. Clean up branch-specific aliases

### 3. Enhanced Cleanup Process

**Two cleanup jobs:**
- `cleanup-branch`: Runs on branch deletion
- `cleanup-pr`: Runs on PR closure

Both jobs:
- Skip cleanup for main/dev branches (production deployments)
- Remove associated Neon database branches
- Delete Vercel preview deployments and aliases

## Benefits

### 1. **Clear Environment Separation**
- Dev branch = stable development environment
- Feature branches = isolated testing environments
- Main branch = production environment

### 2. **Automatic Resource Management**
- No manual cleanup required
- Prevents deployment sprawl
- Keeps Vercel dashboard clean

### 3. **Improved Development Workflow**
- Dev merges update the main dev environment immediately
- Feature branches get isolated preview URLs
- Easy testing with branch-specific environments

### 4. **Cost Optimization**
- Automatic cleanup prevents unnecessary deployment costs
- Reduces Neon database branch accumulation
- Optimizes Vercel project resource usage

## URL Structure

### Production URLs
```
main branch:  https://your-project.vercel.app
dev branch:   https://your-project-dev.vercel.app (or custom domain)
```

### Preview URLs
```
feature/auth: https://feature-auth-yourusername.vercel.app
bugfix/login: https://bugfix-login-yourusername.vercel.app
```

## Configuration Files Modified

### 1. **`.github/workflows/nextjs-deploy-with-neon.yml`**
- Added branch-specific deployment logic
- Enhanced cleanup jobs for both PR closure and branch deletion
- Added Vercel deployment cleanup alongside Neon cleanup

### 2. **`src/frontend/nextjs-app/vercel.json`**
- Maintained Git deployment enablement
- Added `gitFork: false` to prevent fork deployments

### 3. **`src/frontend/nextjs-app/skip-build.js`**
- Continues to allow dev branch builds
- Maintains GitHub Actions build capability

## Vercel Dashboard Configuration

### Required Settings

1. **Production Branch**: Set to `main` in Vercel project settings
2. **Environment Variables**: Configure separately for:
   - **Production** (main branch)
   - **Preview** (dev branch and feature branches)
   - **Development** (local development)

### Environment Variable Strategy

**Production Environment (main branch):**
```bash
NEXT_PUBLIC_USER_POOL_ID=<prod_cognito_pool_id>
DATABASE_URL=<prod_neon_database_url>
AWS_API_GATEWAY_URL=<prod_api_gateway_url>
```

**Preview Environment (dev + feature branches):**
```bash
NEXT_PUBLIC_USER_POOL_ID=<dev_cognito_pool_id>
DATABASE_URL=<dev_neon_database_url>  # Will be overridden by workflow
AWS_API_GATEWAY_URL=<dev_api_gateway_url>
```

## Testing the Setup

### 1. **Test Dev Branch Deployment**
```bash
# Make a change to dev branch
git checkout dev
echo "Test change" >> README.md
git add . && git commit -m "Test dev deployment"
git push origin dev

# Should trigger production deployment for dev environment
```

### 2. **Test Feature Branch Preview**
```bash
# Create feature branch
git checkout -b feature/test-preview
echo "Feature change" >> README.md
git add . && git commit -m "Test preview deployment"
git push origin feature/test-preview

# Should create preview deployment with branch-specific URL
```

### 3. **Test Cleanup Process**
```bash
# Create PR and merge
gh pr create --title "Test cleanup" --body "Testing cleanup"
gh pr merge --squash

# Should trigger cleanup job and remove preview deployment
```

## Monitoring and Troubleshooting

### 1. **GitHub Actions Logs**
- Check workflow runs for deployment status
- Monitor cleanup job execution
- Verify environment variable setup

### 2. **Vercel Dashboard**
- Monitor deployment list for proper cleanup
- Check environment variable configuration
- Verify production vs preview deployment status

### 3. **Neon Console**
- Confirm database branches are cleaned up
- Monitor branch creation/deletion
- Check database connection health

## Migration Notes

### Existing Deployments
- Existing preview deployments will remain until next branch update
- Dev branch will transition to production deployment on next push
- Main branch deployment behavior unchanged

### Environment Variables
- Review and update Vercel environment variable scoping
- Ensure dev branch variables are in Preview scope
- Verify production variables are in Production scope

### Custom Domains
- Update dev branch domain configuration if using custom domains
- Consider setting up dev-specific subdomain for production deployment

## Best Practices

### 1. **Branch Management**
- Keep dev branch up to date with main
- Use descriptive feature branch names
- Delete feature branches after merging

### 2. **Environment Variables**
- Use separate AWS resources for dev/prod environments
- Store sensitive values in Vercel environment variables
- Document required variables for each environment

### 3. **Database Management**
- Monitor Neon branch creation/deletion
- Ensure database migrations run successfully
- Test database connectivity in preview environments

### 4. **Deployment Monitoring**
- Monitor deployment logs for failures
- Set up alerts for failed deployments
- Regular cleanup verification

This strategy provides a robust, automated deployment system that clearly separates development and production environments while maintaining automatic resource cleanup.
