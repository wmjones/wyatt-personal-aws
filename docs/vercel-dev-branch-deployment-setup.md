# Vercel Dev Branch Deployment Setup

## Problem Fixed

The dev branch wasn't triggering Vercel deployments due to:
1. `"deploymentEnabled": false` in `vercel.json`
2. `skip-build.js` only allowing GitHub Actions builds

## Solution Applied

### 1. Enable Git Deployments
Changed `vercel.json`:
```json
{
  "git": {
    "deploymentEnabled": true  // ✅ Now enabled
  }
}
```

### 2. Allow Dev Branch Builds
Updated `skip-build.js` to allow builds from:
- GitHub Actions (existing)
- Dev branch (new)

```javascript
const branch = process.env.VERCEL_GIT_COMMIT_REF;
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const isDevBranch = branch === 'dev';

if (isGitHubActions || isDevBranch) {
  process.exit(1); // Continue build
}
```

## Required Environment Variables

Set these in Vercel Dashboard (Project Settings > Environment Variables) for **Preview** environment:

### Required Variables
```bash
# AWS Cognito (Development)
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_USER_POOL_ID=<from_SSM_/wyatt-personal-aws-dev/cognito_user_pool_id>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<from_SSM_/wyatt-personal-aws-dev/cognito_client_id>

# Database (Development Neon Branch)
DATABASE_URL=<dev_neon_database_url>
DATABASE_URL_UNPOOLED=<dev_neon_database_url_unpooled>

# AWS API Gateway (Development)
AWS_API_GATEWAY_URL=<from_SSM_/wyatt-personal-aws-dev/api_endpoint>
```

### Optional Variables
```bash
# External APIs (for full functionality)
TODOIST_API_KEY=<your_todoist_key>
OPENAI_API_KEY=<your_openai_key>
NOTION_API_KEY=<your_notion_key>

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=<your_analytics_id>
```

## How to Get SSM Parameter Values

### Method 1: AWS CLI
```bash
aws ssm get-parameter --name "/wyatt-personal-aws-dev/cognito_user_pool_id" --query "Parameter.Value" --output text
aws ssm get-parameter --name "/wyatt-personal-aws-dev/cognito_client_id" --query "Parameter.Value" --output text
aws ssm get-parameter --name "/wyatt-personal-aws-dev/api_endpoint" --query "Parameter.Value" --output text
```

### Method 2: AWS Console
1. Go to AWS Systems Manager > Parameter Store
2. Filter by `/wyatt-personal-aws-dev/`
3. Copy the values for each parameter

## Neon Database URLs

### Current Development Branch URLs
Check your Neon project for the latest dev branch URLs:

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project: `quiet-sea-65967959`
3. Navigate to the development branch
4. Copy connection strings:
   - **Pooled**: Use for `DATABASE_URL`
   - **Direct**: Use for `DATABASE_URL_UNPOOLED`

### Example Format
```bash
DATABASE_URL=postgresql://username:password@ep-endpoint-pooler.us-east-2.aws.neon.tech/dbname?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://username:password@ep-endpoint.us-east-2.aws.neon.tech/dbname?sslmode=require
```

## Deployment Environment Setup

In Vercel Dashboard:

1. **Production Environment**: Uses main branch values
2. **Preview Environment**: Use dev branch values (set these for dev branch)
3. **Development Environment**: Local development only

## Verification Steps

After setting up:

1. **Push to dev branch**
2. **Check Vercel deployments** - should see new deployment triggered
3. **Verify environment variables** - check build logs for any missing variables
4. **Test functionality** - ensure authentication and database connections work

## Troubleshooting

### Common Issues

1. **Build still skipping**: Check `skip-build.js` output in Vercel build logs
2. **Environment variable errors**: Verify all required variables are set for Preview environment
3. **Database connection failures**: Ensure Neon URLs are current and accessible
4. **Authentication errors**: Verify Cognito user pool IDs match the dev environment

### Debug Environment Variables

The app includes debug logging in production builds:
```javascript
console.log('Environment debug:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: !!process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  DATABASE_URL_SET: !!process.env.DATABASE_URL,
  // ... other debug info
});
```

Check Vercel function logs for this debug output.

## Automation Alternative

Consider using the GitHub Actions workflow for more complex deployments:
- File: `.github/workflows/nextjs-deploy-with-neon.yml`
- Triggers on dev branch changes
- Automatically creates Neon branches
- Handles environment variable setup

The manual Vercel deployment is faster for simple changes, while GitHub Actions provides full environment provisioning.
