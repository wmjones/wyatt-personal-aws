# Neon-Vercel Integration Setup Guide

## Overview
This integration automatically syncs your Neon database connection strings to Vercel environment variables, eliminating the need to manually update URLs when they change.

## Step 1: Access Neon Console
1. Go to [Neon Console](https://console.neon.tech/)
2. Select your project: **wyatt-personal-aws-neon**
3. Navigate to **Settings** (gear icon in sidebar)

## Step 2: Set Up Vercel Integration in Neon
1. In Neon project settings, look for **"Integrations"** tab
2. Find **"Vercel"** integration
3. Click **"Add Integration"** or **"Connect"**

## Step 3: Authorize Neon to Access Vercel
1. You'll be redirected to Vercel authorization page
2. Click **"Authorize"** to allow Neon access to your Vercel account
3. Select the Vercel team/account where your project is deployed

## Step 4: Connect Your Vercel Project
1. Back in Neon, you'll see a list of your Vercel projects
2. Find your project (likely named similar to "wyatt-personal-aws" or "nextjs-app")
3. Click **"Connect"** next to your project

## Step 5: Configure Environment Variable Names
1. Neon will ask what to name the environment variables
2. Use these exact names to match your application:
   - **Primary variable name**: `DATABASE_URL`
   - **Unpooled variable name**: `DATABASE_URL_UNPOOLED`

## Step 6: Select Vercel Environments
Choose which Vercel environments to sync to:
- ✅ **Production** - For your main deployment
- ✅ **Preview** - For pull request previews
- ✅ **Development** - For development branches

## Step 7: Complete Integration
1. Click **"Save"** or **"Complete Integration"**
2. Neon will automatically add the environment variables to your Vercel project
3. You should see confirmation that variables were added

## Step 8: Verify Integration
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project → Settings → Environment Variables
3. You should now see:
   - `DATABASE_URL` (automatically managed by Neon)
   - `DATABASE_URL_UNPOOLED` (automatically managed by Neon)
4. These will show as "Managed by Integration" or similar

## Benefits of This Integration

### Automatic Updates
- ✅ URLs update automatically when Neon endpoints change
- ✅ New branches get proper database URLs
- ✅ No more manual URL management

### Branch-Aware
- ✅ Production Vercel → Production Neon branch
- ✅ Preview deployments can use development Neon branch
- ✅ Proper isolation between environments

### Always Current
- ✅ No more stale connection strings
- ✅ Deployments always use correct URLs
- ✅ Eliminates database connection errors

## Alternative: Manual Integration Setup

If the GUI integration isn't available, you can set up webhook-based sync:

1. **Create Neon API Key**:
   - Go to Neon Settings → API Keys
   - Create new API key with project access

2. **Create Vercel Token**:
   - Go to Vercel Settings → Tokens
   - Create new token with project access

3. **Set up GitHub Action** (if using GitHub):
   ```yaml
   name: Sync Neon URLs
   on:
     schedule:
       - cron: '0 */6 * * *'  # Every 6 hours
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - name: Update Vercel Env Vars
           run: |
             # Fetch current Neon URL
             DATABASE_URL=$(curl -s "https://console.neon.tech/api/v2/projects/quiet-sea-65967959/connection_uri" \
               -H "Authorization: Bearer ${{ secrets.NEON_API_KEY }}" | jq -r '.uri')

             # Update Vercel
             curl -X PATCH "https://api.vercel.com/v9/projects/${{ secrets.VERCEL_PROJECT_ID }}/env" \
               -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
               -H "Content-Type: application/json" \
               -d '{"key":"DATABASE_URL","value":"'$DATABASE_URL'","target":["production","preview","development"]}'
   ```

## Troubleshooting

### Integration Not Visible
- Make sure you're on a Neon paid plan (integrations may require Pro plan)
- Check that you have admin access to both Neon and Vercel projects

### Variables Not Syncing
- Verify integration is active in Neon settings
- Check Vercel project permissions
- Re-authorize the integration if needed

### Wrong Variable Names
- Edit the integration in Neon to use correct names
- Manually rename variables in Vercel if needed

## Next Steps After Integration

1. **Remove manual DATABASE_URL variables** from Vercel (if they exist)
2. **Test the integration** by triggering a Vercel deployment
3. **Verify** that your app connects to the database successfully
4. **Optional**: Set up branch-specific database connections for better isolation

## Current Project Details
- **Neon Project**: quiet-sea-65967959 (wyatt-personal-aws-neon)
- **Production Branch**: br-tiny-bush-a5io38kv
- **Current Endpoint**: ep-snowy-dust-a5rl14da
- **Database**: neondb
- **Role**: neondb_owner
