# Vercel Deployment Strategy

**Last Updated**: January 6, 2025
**Status**: Active

## Overview

All deployments are controlled by GitHub Actions. Vercel Git integration is disabled to prevent conflicts.

## Branch Deployment Types

### Production Deployments
- **main** → Production deployment (replaces existing)
- **dev** → Production deployment (replaces existing)

### Preview Deployments
- **feature/*** → Preview deployment with unique URL
- **bugfix/*** → Preview deployment with unique URL
- **hotfix/*** → Preview deployment with unique URL

## Workflow Triggers

**File**: `.github/workflows/nextjs-deploy-with-neon.yml`

**Triggers on**:
- Push to supported branches
- Changes in `src/frontend/nextjs-app/**`

**Process**:
1. Create/update Neon database branch
2. Set branch-specific environment variables
3. Run linting and type checks
4. Build and deploy to Vercel
5. Run database migrations

## Database Strategy

Each Git branch gets a matching Neon branch:
- `main` → `branch/main` (production data)
- `dev` → `branch/dev` (staging data)
- `feature/xyz` → `branch/feature-xyz` (isolated copy)

## Cleanup

**File**: `.github/workflows/neon-branch-cleanup.yml`

Automatic cleanup when:
- PR is closed
- Branch is deleted
- Weekly scheduled cleanup

Protected branches (never deleted): main, dev

## Environment Variables

### Production (main/dev)
Set in Vercel dashboard, shared across deployments.

### Preview (feature branches)
Set dynamically per branch via GitHub Actions:
- `DATABASE_URL` - Branch-specific Neon connection
- `DATABASE_URL_UNPOOLED` - Direct connection for migrations
- `DEPLOYMENT_BRANCH` - Current branch name

## URLs

### Production
- main: `https://your-project.vercel.app`
- dev: Same URL (replaces previous deployment)

### Preview
- Pattern: `https://{branch-name}-{github-username}.vercel.app`
- Example: `https://feature-auth-wmjones.vercel.app`

## Key Configuration

**vercel.json**:
```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

This ensures all deployments go through GitHub Actions only.
