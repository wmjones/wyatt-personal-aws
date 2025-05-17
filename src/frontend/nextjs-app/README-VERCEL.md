# Vercel Deployment Setup

This document explains how to set up Vercel deployment for the D3 Dashboard.

## Required Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

1. `VERCEL_TOKEN`: Your Vercel API token
2. `VERCEL_ORG_ID`: Your Vercel organization ID
3. `VERCEL_PROJECT_ID`: Your Vercel project ID

## Getting Vercel Credentials

### 1. Create Vercel Token
1. Go to https://vercel.com/account/tokens
2. Create a new token with full scope
3. Copy and save as `VERCEL_TOKEN` in GitHub secrets

### 2. Get Organization and Project IDs
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Find IDs in `.vercel/project.json`:
   ```json
   {
     "orgId": "...",  // This is VERCEL_ORG_ID
     "projectId": "..." // This is VERCEL_PROJECT_ID
   }
   ```

## Environment Variables

Set these in Vercel dashboard (Project Settings > Environment Variables):

### Required for All Environments
```bash
# AWS Cognito
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=<from_terraform_output>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<from_terraform_output>

# Database (when available)
DATABASE_URL=<neon_connection_string>
DATABASE_URL_UNPOOLED=<neon_direct_string>

# External APIs
TODOIST_API_KEY=<your_key>
OPENAI_API_KEY=<your_key>
NOTION_API_KEY=<your_key>
```

## Deployment Process

### Automatic Deployments
- **Production**: Merges to `main` branch
- **Preview**: Pull requests to `main` or `dev`

### Manual Deployment
```bash
cd src/frontend/nextjs-app

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

## Monitoring

1. **Build Status**: Check GitHub Actions tab
2. **Deployment Logs**: View in Vercel dashboard
3. **Preview URLs**: Posted as PR comments

## Troubleshooting

### Build Failures
1. Check GitHub Actions logs
2. Verify all dependencies in package.json
3. Ensure environment variables are set

### Environment Variables Not Working
1. Check variable names match exactly
2. Verify scope (Production/Preview/Development)
3. Redeploy after adding variables

### Preview Deployments Not Working
1. Ensure PR targets correct branch
2. Check GitHub secrets are set
3. Verify workflow file syntax

## Local Testing

Test the build locally:
```bash
npm run build
npm start
```

Test with Vercel CLI:
```bash
vercel dev
```
