# Neon-Vercel Integration: Quick Start Guide

## 🎯 Best Option for You: Vercel Marketplace Integration

Since you already have both Neon and Vercel accounts, the **Vercel Marketplace** route is the easiest.

## Step-by-Step Setup

### 1. Go to Vercel Marketplace
**Direct Link**: https://vercel.com/marketplace/neon

Or navigate manually:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Marketplace" in the top nav
3. Search for "Neon"
4. Click on "Neon" integration

### 2. Install the Integration
1. Click **"Add Integration"**
2. Select your Vercel account/team
3. Choose **"Connect to existing Neon account"** (since you already have one)
4. Click **"Continue"**

### 3. Authorize Neon Access
1. You'll be redirected to authorize Neon
2. Click **"Authorize"** to allow Vercel access to your Neon account
3. Select your Neon project: **"wyatt-personal-aws-neon"**

### 4. Configure Your Vercel Project
1. Select your Vercel project (likely "nextjs-app" or similar)
2. **Important**: Configure these environment variable names:
   - Primary: `DATABASE_URL`
   - Unpooled: `DATABASE_URL_UNPOOLED`
3. Select environments: ✅ Production, ✅ Preview, ✅ Development

### 5. Verify Installation
After setup, check your Vercel project:
1. Go to Project Settings → Environment Variables
2. You should see:
   - `DATABASE_URL` (managed by Neon integration)
   - `DATABASE_URL_UNPOOLED` (managed by Neon integration)

## 🎉 What This Gets You

### Automatic URL Management
- ✅ Database URLs automatically update when Neon endpoints change
- ✅ No more manual URL hunting
- ✅ No more stale connection strings

### Preview Branch Magic
- ✅ Each Vercel preview deployment gets its own Neon database branch
- ✅ Isolated testing environments
- ✅ No database conflicts between deployments

### Zero Maintenance
- ✅ Set it once, forget about it
- ✅ Works across all Vercel environments
- ✅ Handles Neon infrastructure changes automatically

## After Integration Setup

### Remove Manual Database URLs
1. Go to Vercel Project Settings → Environment Variables
2. **Delete** any manually set `DATABASE_URL` and `DATABASE_URL_UNPOOLED`
3. Keep only the integration-managed ones

### Test the Integration
1. Make a small change to your app
2. Push to trigger a Vercel deployment
3. Check deployment logs for successful database connection
4. Verify your app works correctly

## Fallback: Manual Setup (If Integration Doesn't Work)

If the Vercel Marketplace integration isn't available:

1. **Use Current URLs**: Use the updated URLs from `/docs/vercel-env-current-neon-urls.md`
2. **Monitor for Changes**: Check Neon console periodically for endpoint changes
3. **Set Calendar Reminder**: Monthly check for URL updates

## Current Status

For immediate testing while setting up integration:
```
DATABASE_URL=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-snowy-dust-a5rl14da-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-snowy-dust-a5rl14da.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Questions to Ask During Setup

- **"Which Neon project?"** → wyatt-personal-aws-neon
- **"Which Vercel project?"** → Your Next.js app project
- **"Environment variable names?"** → DATABASE_URL and DATABASE_URL_UNPOOLED
- **"Which environments?"** → Production, Preview, Development

## Need Help?
If you run into issues:
1. Check Vercel integration status in project settings
2. Verify Neon project permissions
3. Re-authorize if connection fails
4. Fall back to manual URL setup as temporary solution
