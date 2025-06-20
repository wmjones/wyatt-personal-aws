# Testing with Neon Database Branches

**Last Updated**: January 6, 2025
**Status**: Current

## Overview

Database branches are created automatically when you push code to GitHub, not when you create a PR. Each Git branch gets its own isolated Neon database branch for testing.

## How It Works

### Automatic Branch Creation

When you **push to a branch**, the `nextjs-deploy-with-neon.yml` workflow:
1. Creates a Neon branch named `branch/{your-branch-name}`
2. Copies all data from the parent database
3. Deploys to Vercel with branch-specific database URLs
4. Sets environment variables automatically

**Supported branches:**
- `main` - Production database
- `dev` - Staging database
- `feature/**` - Isolated test databases
- `bugfix/**` - Isolated test databases
- `hotfix/**` - Isolated test databases

### No PR Required

Unlike the old documentation suggests, you **don't need to create a PR** to get a database branch. Simply pushing to a supported branch pattern triggers:
- Neon database branch creation
- Vercel deployment with the new database
- Automatic environment variable configuration

## Local Testing

To test locally with your branch's database:

```bash
# Push your branch to GitHub first
git push origin feature/my-feature

# Wait for GitHub Actions to complete (~13 minutes)
# Check the Actions tab for your branch deployment

# Get the database URLs from Vercel dashboard or GitHub Actions logs
# Create .env.local
echo "DATABASE_URL=<your-branch-pooled-url>" > .env.local
echo "DATABASE_URL_UNPOOLED=<your-branch-direct-url>" >> .env.local

# Run locally
npm run dev
```

## Finding Your Database URLs

### Option 1: Vercel Dashboard
1. Go to your Vercel project
2. Click on "Settings" → "Environment Variables"
3. Filter by your branch name
4. Copy the DATABASE_URL values

### Option 2: GitHub Actions Logs
1. Go to Actions tab in GitHub
2. Find the "Deploy Next.js to Vercel" workflow for your branch
3. Check the "Create or get Neon branch" step for URLs

### Option 3: Neon Console
1. Login to Neon Console
2. Find branch named `branch/{your-branch-name}`
3. Copy connection strings

## Database Operations

### Running Migrations
```bash
# Use the unpooled URL for migrations
DATABASE_URL_UNPOOLED=<your-branch-direct-url> npm run db:migrate
```

### Connecting Directly
```bash
# Connect with psql
psql <your-branch-pooled-url>

# Run queries
SELECT * FROM users LIMIT 10;
```

## Automatic Cleanup

Database branches are automatically deleted when:
- PR is closed (merged or not)
- Branch is deleted from GitHub
- Weekly cleanup runs (for old branches)
- Manual cleanup is triggered

**Protected branches** (never deleted):
- `main` and `branch/main`
- `dev` and `branch/dev`

## Deployment Flow

1. **Push to GitHub** → Triggers workflow
2. **Neon branch created** → Isolated database copy
3. **Vercel deployment** → App deployed with new database
4. **Environment vars set** → Automatic configuration
5. **Ready to test** → Access via Vercel preview URL

## Best Practices

1. **Push early** - Get your database branch as soon as you start work
2. **Use branch patterns** - Stick to `feature/`, `bugfix/`, `hotfix/` prefixes
3. **Test migrations** - Always test schema changes on branch databases
4. **Let cleanup happen** - Don't manually delete Neon branches

## Troubleshooting

### No database branch created
- Check if your branch matches supported patterns
- Verify GitHub Actions ran successfully
- Ensure Neon API key is configured in GitHub secrets

### Can't connect to database
- Use the pooled URL for applications
- Use the unpooled URL for migrations
- Check if your IP is allowed in Neon settings

### Database out of sync
- Neon branches are created from the parent at push time
- If parent database changed, create a new branch by pushing again

## Manual Branch Management

If needed, use the Neon CLI:

```bash
# List branches
neon branch list

# Create manually
neon branch create --name branch/manual-test

# Delete manually (avoid this)
neon branch delete branch/manual-test
```

## Summary

- **Push code** to get a database branch (no PR needed)
- **Automatic creation** via GitHub Actions
- **Automatic cleanup** when branch is deleted
- **Branch patterns** determine deployment type
- **Protected branches** (main/dev) never deleted
