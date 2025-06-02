# Vercel Branch Deployment Environment Variables Debug Guide

## Current Issue

Branch deployments are failing with:
```
Error: Missing required environment variables:
DATABASE_URL
DATABASE_URL_UNPOOLED
```

Even though these variables are configured in Vercel dashboard, they're not being applied to branch deployments.

## Debug Steps

### 1. Check Environment Variable Scope in Vercel

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables" section
3. For each environment variable, verify it's applied to:
   - ✅ **Production** (for main branch)
   - ✅ **Preview** (for feature branches) ← **This is likely missing**
   - ✅ **Development** (for local dev)

### 2. Use Debug Endpoint

After deploying the current branch, visit:
```
https://your-branch-deployment.vercel.app/api/debug/env
```

This will show:
- Which environment variables are actually set
- Vercel deployment context
- Branch information

### 3. Check Vercel Git Integration

The issue might be related to:
- **Git deployments were disabled** (`deploymentEnabled: false`) - now fixed
- Branch-specific environment variable inheritance
- Preview deployment settings

### 4. Verify Environment Variable Names

Ensure in Vercel dashboard the variable names exactly match:
```
DATABASE_URL
DATABASE_URL_UNPOOLED
AWS_API_GATEWAY_URL
NEXT_PUBLIC_AWS_REGION
NEXT_PUBLIC_USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID
```

### 5. Check Branch Protection Rules

If you have branch protection rules, ensure they don't interfere with environment variable inheritance.

## Quick Fix Options

### Option A: Enable Preview for All Variables
In Vercel dashboard, for each environment variable:
1. Click the variable name
2. Ensure "Preview" is checked
3. Save changes

### Option B: Use Vercel CLI to Verify
```bash
vercel env ls
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL_UNPOOLED preview
# etc.
```

### Option C: Force Redeploy
After ensuring environment variables are scoped to "Preview":
1. Push a small commit to trigger redeploy
2. Or use Vercel dashboard "Redeploy" button

## Expected Debug Output

When the debug endpoint works, you should see:
```json
{
  "VERCEL_ENV": "preview",
  "environmentVariables": {
    "DATABASE_URL": true,
    "DATABASE_URL_UNPOOLED": true,
    "AWS_API_GATEWAY_URL": true,
    // etc.
  }
}
```

If any show `false`, they're not properly configured for preview deployments.

## Vercel Environment Scopes

- **Production**: Only applies to production domain (main branch)
- **Preview**: Applies to all preview deployments (feature branches)
- **Development**: Only for local development

**Most likely fix**: Ensure all variables are scoped to "Preview" in addition to "Production".
