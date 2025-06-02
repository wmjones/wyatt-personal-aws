# Vercel Environment Variables Setup Guide

## Overview
This guide provides the exact environment variables needed to fix the Vercel deployment errors and get the application running properly.

## Required Environment Variables

### 1. AWS Cognito Configuration
These are public variables that can be accessed from the client-side:

```
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_USER_POOL_ID=us-east-2_FebjdKLG3
NEXT_PUBLIC_USER_POOL_CLIENT_ID=3i464fgdtarund735fjc0b5b6c
```

### 2. Database Configuration (Neon)
These are server-side only variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-polished-hill-a5e0j2vc-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-polished-hill-a5e0j2vc.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. AWS API Gateway
For backend API integration:

```
AWS_API_GATEWAY_URL=https://v1zx8vrzzj.execute-api.us-east-2.amazonaws.com
```

### 4. External API Keys
These need to be obtained from respective services:

```
TODOIST_API_KEY=[Need to obtain from Todoist]
OPENAI_API_KEY=[Need to obtain from OpenAI]
NOTION_API_KEY=[Need to obtain from Notion]
```

## Setup Instructions

### Step 1: Access Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (wyatt-personal-aws or similar)
3. Navigate to Settings → Environment Variables

### Step 2: Add Environment Variables
For each variable, you need to:
1. Click "Add New"
2. Enter the Key (variable name)
3. Enter the Value
4. Select environments: ✓ Production, ✓ Preview, ✓ Development
5. Click "Save"

### Step 3: Variable Configuration Details

#### Public Variables (Client-side accessible)
- **NEXT_PUBLIC_AWS_REGION**: `us-east-2`
- **NEXT_PUBLIC_USER_POOL_ID**: `us-east-2_FebjdKLG3`
- **NEXT_PUBLIC_USER_POOL_CLIENT_ID**: `3i464fgdtarund735fjc0b5b6c`

#### Private Variables (Server-side only)
- **DATABASE_URL**: Use the pooled connection string from above
- **DATABASE_URL_UNPOOLED**: Use the unpooled connection string from above
- **AWS_API_GATEWAY_URL**: `https://v1zx8vrzzj.execute-api.us-east-2.amazonaws.com`

#### API Keys (Need to be obtained)
- **TODOIST_API_KEY**: Get from https://todoist.com/app/settings/integrations/developer
- **OPENAI_API_KEY**: Get from https://platform.openai.com/api-keys
- **NOTION_API_KEY**: Get from https://www.notion.so/my-integrations

### Step 4: Verify Project Settings
1. Go to Settings → General
2. Ensure:
   - Root Directory: `src/frontend/nextjs-app`
   - Framework Preset: Next.js
   - Node.js Version: 20.x (recommended)

### Step 5: Trigger Redeployment
1. Go to the Deployments tab
2. Click the three dots on the latest deployment
3. Select "Redeploy"
4. Monitor the build logs for any errors

## Testing the Fix

### 1. Check Build Logs
Look for successful environment variable loading:
```
✓ Environment variables loaded successfully
✓ Next.js detected correctly
```

### 2. Test API Endpoints
After deployment, test these URLs (replace with your actual Vercel URL):
- `https://your-app.vercel.app/api/forecast/cache`
- `https://your-app.vercel.app/api/data/athena`

These should no longer return 500 errors.

### 3. Verify Application Functionality
- Test the demand planning dashboard
- Verify data loads from Athena
- Check that authentication works properly

## Obtaining Missing API Keys

### Todoist API Key
1. Sign in to Todoist
2. Go to Settings → Integrations → Developer
3. Create a new app or use existing
4. Copy the API token

### OpenAI API Key
1. Sign in to OpenAI Platform
2. Go to API Keys section
3. Create new secret key
4. Copy immediately (won't be shown again)

### Notion API Key
1. Go to https://www.notion.so/my-integrations
2. Create new integration
3. Copy the Internal Integration Token
4. Share relevant Notion pages with the integration

## Troubleshooting

### If environment variables still don't work:
1. Clear build cache in Vercel settings
2. Check for typos in variable names
3. Ensure no trailing spaces in values
4. Verify quotes aren't included in the values

### If database connection fails:
1. Verify Neon database is active
2. Check IP allowlist settings in Neon
3. Ensure SSL mode is set correctly

### If API routes still fail:
1. Check Vercel function logs for specific errors
2. Verify all required variables are set
3. Ensure variables are available in the correct environment

## Security Notes

- Never commit real API keys to version control
- Use different API keys for production vs development
- Regularly rotate sensitive credentials
- Monitor API usage for unusual activity
