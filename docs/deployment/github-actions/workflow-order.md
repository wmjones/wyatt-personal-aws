# Workflow Execution Order

**Last Updated**: January 6, 2025

## Trigger Events

**Push to dev**: Automatic execution
**Push to main**: Manual approval required
**Feature branches**: No automated workflows

## Execution Sequence

When code is pushed to dev or main:

1. **Terraform Plan** (2 min) - Validates infrastructure changes
2. **Terraform Apply** (5 min) - Deploys AWS resources
3. **SSM Sync** (1 min) - Updates parameter store
4. **Frontend Deploy** (3 min) - Vercel deployment with Neon branch
5. **Database Migration** (2 min) - Applies schema changes

**Total Time**: ~13 minutes

## Parallel Execution

After Terraform completes, these can run simultaneously:
- SSM parameter sync
- Lambda package builds

## Failure Handling

If any step fails:
- Subsequent steps are skipped
- GitHub creates an issue
- Team receives notification
- Rollback instructions provided
