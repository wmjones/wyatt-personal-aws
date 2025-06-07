# Git-Connected Vercel Project Workflow Updates

## Summary of Changes

Your GitHub Actions workflows have been updated to properly support a Git-connected Vercel project. The key changes ensure that branch-specific environment variables are properly set in Vercel and associated with Git branches.

## Key Updates Made

### 1. Deploy Workflow (`nextjs-deploy-with-neon.yml`)
- **Added branch-specific environment variable setup**: Now sets `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `DEPLOYMENT_BRANCH` in Vercel for each branch
- **Updated `vercel pull` command**: Uses `--git-branch` flag for preview deployments
- **Removed manual environment variable passing**: No longer passes `-e` flags during deployment
- **Added Git metadata**: Uses `--meta` flags to ensure proper Git association

### 2. Cleanup Workflow (`cleanup-branch-resources.yml`)
- **Added Vercel CLI installation**: Required for removing environment variables
- **Implemented environment variable cleanup**: Removes branch-specific variables when branches are deleted
- **Updated documentation**: Reflects Git-connected project status

## Next Steps

1. **Push these changes to trigger a new deployment**:
   ```bash
   git add .github/workflows/
   git commit -m "fix: update workflows for Git-connected Vercel project"
   git push
   ```

2. **Monitor the deployment**: The workflow will now:
   - Create Neon database branch
   - Set branch-specific environment variables in Vercel
   - Deploy with proper Git metadata
   - Environment variables should be available at runtime

3. **Verify in Vercel Dashboard**:
   - Go to your Vercel project settings
   - Check Environment Variables section
   - You should see branch-specific variables for your feature branch

## How It Works Now

1. **On Push**: GitHub Actions workflow creates a Neon database branch and sets branch-specific environment variables in Vercel
2. **During Build**: Vercel pulls the correct environment variables based on Git branch
3. **At Runtime**: Your application has access to the branch-specific DATABASE_URL
4. **On Cleanup**: When branches are deleted, both Neon branches and Vercel environment variables are cleaned up

## Troubleshooting

If you still see "Branch: unknown" errors after these changes:

1. **Verify Git connection**:
   ```bash
   vercel project ls
   ```
   Should show your Git repository URL

2. **Check environment variables**:
   ```bash
   vercel env ls preview feature/fix-database-auth
   ```

3. **Force a new deployment**:
   ```bash
   vercel --force
   ```

The key difference is that environment variables are now persistently stored in Vercel and automatically applied based on Git branch metadata, rather than being passed temporarily during deployment.
