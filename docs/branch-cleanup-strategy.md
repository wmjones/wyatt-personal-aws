# Branch Cleanup Strategy

## Overview

This document describes the automated cleanup process for removing Vercel environment variables and Neon database branches when GitHub branches are deleted or merged.

## Automated Cleanup Workflow

The `cleanup-branch-resources.yml` workflow automatically triggers when:
- A branch is deleted
- A pull request is merged

### What Gets Cleaned Up

1. **Vercel Environment Variables**:
   - `DATABASE_URL` (branch-specific)
   - `DATABASE_URL_UNPOOLED` (branch-specific)
   - `DEPLOYMENT_BRANCH` (branch-specific)

2. **Neon Database Branches**:
   - The corresponding `branch/{sanitized-branch-name}` database branch

### Protected Branches

The following branches are protected from cleanup:
- `main`
- `dev`

These branches maintain their environment variables and database connections permanently.

## How It Works

1. **Branch Deletion Detection**: The workflow triggers on GitHub's `delete` event or when a PR is merged
2. **Branch Name Extraction**: Determines which branch needs cleanup
3. **Sanitization**: Applies the same branch name sanitization as the deployment workflow
4. **Vercel Cleanup**: Uses `vercel env rm` with the `--git-branch` flag to remove branch-specific variables
5. **Neon Cleanup**: Uses Neon API to find and delete the corresponding database branch
6. **Error Handling**: Logs any failures for manual intervention

## Manual Cleanup

If the automated cleanup fails, you can manually clean up resources:

### Vercel Environment Variables

```bash
# List all environment variables
vercel env ls

# Remove specific branch variables
vercel env rm DATABASE_URL production --git-branch="feature/branch-name" --yes
vercel env rm DATABASE_URL_UNPOOLED production --git-branch="feature/branch-name" --yes
vercel env rm DEPLOYMENT_BRANCH production --git-branch="feature/branch-name" --yes
```

### Neon Database Branches

1. Go to [Neon Console](https://console.neon.tech/)
2. Navigate to your project
3. Go to "Branches" tab
4. Find branches prefixed with `branch/`
5. Delete any orphaned branches

## Monitoring Cleanup

Check the Actions tab in GitHub to monitor cleanup workflow runs:
- ✅ Successful cleanup shows all resources removed
- ⚠️ Warnings indicate some resources were already cleaned or didn't exist
- ❌ Errors require manual intervention

## Best Practices

1. **Regular Audits**: Periodically check for orphaned resources
2. **Branch Naming**: Use consistent branch naming to ensure proper cleanup
3. **PR Workflow**: Always merge PRs instead of deleting branches directly when possible
4. **Protected Branches**: Never manually delete env vars for main/dev branches

## Troubleshooting

### Common Issues

1. **"Environment variable not found"**: The variable was already removed or never existed
2. **"Branch not found"**: The Neon branch was already deleted or never created
3. **Rate limiting**: Wait and retry if hitting API rate limits

### Debug Commands

```bash
# Check which branches have environment variables
vercel env ls production

# List all Neon branches
curl -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches"

# Manually delete a Neon branch
curl -X DELETE -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID"
```

## Security Considerations

- Cleanup workflow has minimal permissions (only delete access)
- Protected branches cannot be cleaned up accidentally
- All API keys are stored as GitHub secrets
- Cleanup logs don't expose sensitive information

## Future Improvements

1. **Scheduled Cleanup**: Add a weekly job to clean up orphaned resources
2. **Notifications**: Send alerts when cleanup fails
3. **Metrics**: Track resource usage and cleanup success rates
4. **Retention Policy**: Keep branches for X days before cleanup
