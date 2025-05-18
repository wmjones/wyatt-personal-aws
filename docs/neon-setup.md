# Neon Database Branching Setup

This guide explains how to set up and use Neon database branching for testing pull requests.

## Overview

Neon branching allows you to create isolated database copies for each pull request, enabling safe testing of database changes without affecting production or development data.

## Prerequisites

1. A Neon account and project
2. GitHub repository with Actions enabled
3. Vercel project (optional, for automatic preview deployments)

## Setup Instructions

### 1. GitHub Secrets

Add the following secrets to your GitHub repository:

1. **NEON_API_KEY**: Your Neon API key
   - Get from: https://console.neon.tech/app/settings/api-keys
   - Add to: Settings → Secrets and variables → Actions → New repository secret

2. **VERCEL_TOKEN** (optional): Your Vercel API token
   - Get from: https://vercel.com/account/tokens
   - Required only if you want automatic Vercel preview updates

### 2. GitHub Variables

Add the following variables to your repository:

1. **NEON_PROJECT_ID**: Your Neon project ID
   - Find in: Neon console → Your project → Settings
   - Add to: Settings → Secrets and variables → Actions → Variables → New repository variable

2. **VERCEL_PROJECT_ID** (optional): Your Vercel project ID
   - Find in: Vercel dashboard → Project Settings → General
   - Required only for Vercel integration

### 3. Workflow File

The workflow file has already been created at `.github/workflows/neon-branches.yml`

## How It Works

### When a PR is opened, reopened, or updated:

1. Creates a new Neon branch named `preview/pr-{number}-{branch-name}`
2. Copies all data from the parent branch
3. Posts a comment with connection details
4. (Optional) Updates Vercel preview environment variables

### When a PR is closed:

1. Automatically deletes the Neon branch
2. Posts a confirmation comment

## Local Testing

To test with a PR's database locally:

1. Find the database URL in the PR comment
2. Create `.env.local` in your Next.js app:
   ```bash
   DATABASE_URL=postgresql://...
   DATABASE_URL_UNPOOLED=postgresql://...
   ```
3. Run your application:
   ```bash
   npm run dev
   ```

## Database Migrations

To run migrations on PR branches, uncomment the migration section in the workflow:

```yaml
- name: Run Migrations
  run: npm run db:migrate
  env:
    DATABASE_URL: "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}"
```

## Schema Diff

To enable schema diff comments, uncomment the schema diff section:

```yaml
- name: Post Schema Diff Comment to PR
  uses: neondatabase/schema-diff-action@v1
  with:
    project_id: ${{ vars.NEON_PROJECT_ID }}
    compare_branch: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
    api_key: ${{ secrets.NEON_API_KEY }}
```

## Troubleshooting

### Branch creation fails
- Check NEON_API_KEY is correct
- Verify NEON_PROJECT_ID is set
- Ensure you have available branches in your Neon plan

### Vercel environment not updating
- Verify VERCEL_TOKEN is set
- Check VERCEL_PROJECT_ID is correct
- Ensure the token has write permissions

### Connection issues
- Use the pooled connection URL for serverless environments
- Use the unpooled URL for long-running connections
- Check firewall rules if connecting from restricted networks

## Best Practices

1. **Don't commit database URLs**: They contain credentials
2. **Use pooled connections**: Better for serverless/edge functions
3. **Clean up old branches**: They count against your Neon plan limits
4. **Test migrations**: Always test on PR branches before merging
5. **Monitor usage**: Check Neon dashboard for branch usage

## Cost Considerations

- Each branch counts against your Neon plan limits
- Branches are automatically deleted when PRs close
- Consider upgrading your plan if you hit limits frequently

## Advanced Usage

### Custom Branch Names

Modify the branch naming pattern in the workflow:

```yaml
branch_name: custom-prefix-${{ github.event.number }}
```

### Multiple Databases

For projects with multiple databases, create additional workflow jobs:

```yaml
create_analytics_branch:
  name: Create Analytics DB Branch
  # ... similar configuration
```

### Conditional Branching

Only create branches for certain paths:

```yaml
if: |
  github.event_name == 'pull_request' &&
  contains(github.event.pull_request.changed_files, 'database/')
```
