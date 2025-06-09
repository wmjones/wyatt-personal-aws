# Neon Branch Management

This document describes the automated branch management strategy for Neon database branches in this project.

## Overview

To prevent hitting Neon's branch limits, we implement an automated cleanup strategy that:
- Automatically deletes preview branches when PRs are closed
- Cleans up branches when GitHub branches are deleted
- Runs weekly cleanup of old deployment branches
- Provides manual cleanup options via workflow dispatch

## Branch Naming Convention

| Branch Type | Pattern | Example | Lifecycle |
|-------------|---------|---------|-----------|
| Preview | `preview/pr-{number}-{branch}` | `preview/pr-123-feature/new-api` | Deleted on PR close |
| Dev Deployment | `dev-deployment-{sha}` | `dev-deployment-abc123` | Keep last 5 |
| Main Deployment | `main-deployment-{sha}` | `main-deployment-def456` | Keep last 5 |

## Automated Cleanup Triggers

### 1. PR Close/Merge
- **When**: Pull request is closed or merged
- **What**: Deletes the corresponding `preview/pr-*` branch
- **Workflow**: `neon-branch-cleanup.yml` (cleanup-pr-branch job)

### 2. Branch Deletion
- **When**: Any GitHub branch is deleted (except main/dev)
- **What**: Deletes all Neon branches containing the branch name
- **Workflow**: `neon-branch-cleanup.yml` (cleanup-deleted-branch job)

### 3. Weekly Schedule
- **When**: Every Sunday at midnight UTC
- **What**:
  - Keeps only the 5 most recent deployment branches per environment
  - Deletes orphaned preview branches older than 7 days
- **Workflow**: `neon-branch-cleanup.yml` (cleanup-old-deployments job)

### 4. Manual Trigger
- **When**: Triggered manually via GitHub Actions
- **Options**:
  - `old-deployments`: Same as scheduled cleanup
  - `all-preview`: Delete all preview branches
  - `specific-branch`: Delete a specific branch by name
- **Workflow**: `neon-branch-cleanup.yml` (manual-cleanup job)

## Monitoring

The cleanup workflow includes a monitoring job that:
- Reports current branch usage (count/limit)
- Breaks down branches by type
- Warns when usage exceeds 80%
- Creates a summary in GitHub Actions

## Manual Cleanup

If you need to perform manual cleanup:

1. **Via GitHub Actions UI**:
   ```
   Actions → Neon Branch Cleanup → Run workflow
   ```

2. **Via Neon CLI**:
   ```bash
   # List branches
   neonctl branches list --project-id $NEON_PROJECT_ID

   # Delete specific branch
   neonctl branches delete BRANCH_NAME --project-id $NEON_PROJECT_ID --force
   ```

## Troubleshooting

### Branch Limit Errors

If you encounter "branches limit exceeded" errors:

1. Run manual cleanup:
   ```bash
   gh workflow run neon-branch-cleanup.yml -f cleanup_type=all-preview
   ```

2. Check branch usage:
   ```bash
   neonctl branches list --project-id $NEON_PROJECT_ID | wc -l
   ```

3. Delete old deployment branches manually if needed

### Failed Cleanup

The cleanup workflow uses `continue-on-error` for branch deletions, so:
- Missing branches won't cause workflow failure
- Check workflow logs for specific errors
- Branches might be protected or have active connections

## Configuration

Required secrets and variables:
- `NEON_API_KEY`: API key with branch management permissions
- `NEON_PROJECT_ID`: The Neon project ID (stored as a variable)

## Best Practices

1. **Don't create long-lived feature branches** - They consume Neon branches
2. **Merge PRs promptly** - This triggers automatic cleanup
3. **Use the preview environment** - It's automatically cleaned up
4. **Monitor branch usage** - Check the weekly cleanup reports
5. **Delete unused GitHub branches** - This triggers Neon cleanup

## Future Improvements

- [ ] Add Slack/email notifications for high branch usage
- [ ] Implement branch protection for critical branches
- [ ] Add metrics tracking for branch lifecycle
- [ ] Consider implementing branch pooling for previews
