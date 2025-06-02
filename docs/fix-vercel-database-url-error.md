# Fix for Vercel DATABASE_URL Missing Error

## Problem Summary

Your Vercel preview deployment (`dpl_4eVV56bT5L6n6qB1QmyxJhNTyJsC`) is failing with missing DATABASE_URL and DATABASE_URL_UNPOOLED environment variables. The debug output shows:

```
DATABASE_URL_SET: false
DATABASE_URL_UNPOOLED_SET: false
```

## Root Cause

The deployment was created using the old `nextjs-deploy.yml` workflow which doesn't properly coordinate with Neon database branch creation. The new consolidated workflow (`nextjs-deploy-with-neon.yml`) wasn't being used because both workflows were active.

## Solution

### Step 1: Workflow Cleanup (Completed)
- Deleted `.github/workflows/nextjs-deploy.yml`
- Deleted `.github/workflows/neon-branches.yml`
- Now only `nextjs-deploy-with-neon.yml` will run

### Step 2: Manual Fix for Current Deployment

Since the current deployment is already created, you need to manually set the database URLs in Vercel:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables with "Preview" scope enabled:

```
DATABASE_URL=postgresql://neondb_owner:[password]@[host]/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:[password]@[host]/neondb?sslmode=require
```

To get your actual database URLs:
1. Go to Neon dashboard: https://console.neon.tech/
2. Select your project
3. Go to Connection Details
4. Copy the connection strings (use "Pooled connection" for DATABASE_URL)

### Step 3: Redeploy

After adding the environment variables:
1. Go to your project's Deployments tab in Vercel
2. Find the latest deployment
3. Click the three dots menu → Redeploy
4. Or trigger a new deployment by pushing a commit

### Step 4: Verify Neon-Vercel Integration

For future automatic syncing:
1. In Neon dashboard, go to Settings → Integrations
2. Check if Vercel integration is connected
3. If not, click "Connect to Vercel" and follow the setup

### Step 5: Test the Fix

Once redeployed, visit:
- `https://your-deployment-url.vercel.app/api/debug/env`

You should see:
```json
{
  "environmentVariables": {
    "DATABASE_URL": true,
    "DATABASE_URL_UNPOOLED": true,
    ...
  }
}
```

## Future Deployments

With the old workflows deleted, all future deployments will use the consolidated workflow which:
1. Creates a Neon branch first
2. Passes database URLs to Vercel build
3. Ensures proper environment variable availability

## Commit Message for Workflow Cleanup

```bash
git add -A
git commit -m "fix: Remove conflicting deployment workflows

- Delete nextjs-deploy.yml and neon-branches.yml
- Keep only nextjs-deploy-with-neon.yml for proper Neon integration
- Fixes DATABASE_URL missing errors in preview deployments"
```
