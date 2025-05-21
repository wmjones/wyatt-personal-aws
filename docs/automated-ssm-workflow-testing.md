# Testing the Automated SSM Workflow

This document outlines how to test the new automated SSM parameters workflow that runs after Terraform apply.

## Overview

The automated workflow (`ssm_params.yml`) now:
- ✅ Triggers automatically after successful Terraform apply
- ✅ Determines environment from branch (main=prod, dev=dev)
- ✅ Uses OIDC authentication with `AWS_ACCOUNT_ID` secret
- ✅ Keeps manual trigger option for testing

## Testing Plan

### Phase 1: Manual Testing (Safe First Step)

1. **Before merging**, test the manual trigger on the feature branch:
   ```
   - Go to GitHub Actions → "Configure SSM Parameters for Deployment"
   - Click "Run workflow"
   - Select branch: feature/automated-ssm-after-terraform
   - Select environment: dev
   - Run and verify it completes successfully
   ```

2. **Expected Result**:
   - Workflow should authenticate with OIDC successfully
   - Should read Terraform outputs and update SSM parameters
   - Should show proper deployment summary

### Phase 2: Automated Testing

1. **Create Pull Request**:
   - Create PR from `feature/automated-ssm-after-terraform` to `dev`
   - Review changes in the workflow file

2. **Merge and Test Automation**:
   - Merge PR to `dev` branch
   - Make a small change to trigger Terraform apply (e.g., update a tag)
   - Push to `dev` branch
   - Watch for automatic workflow chain:
     ```
     Terraform Apply (triggered by push)
     ↓ (on success)
     SSM Parameters (triggered automatically)
     ```

### Phase 3: Verification

1. **Check Workflow Logs**:
   - Verify environment detection: "Auto trigger from dev branch - Environment: dev"
   - Confirm OIDC authentication works
   - Check SSM parameter updates

2. **Verify SSM Parameters**:
   ```bash
   # Check that parameters were updated
   aws ssm get-parameters-by-path --path "/wyatt-personal-aws-dev/" --recursive
   ```

3. **Check Deployment Summary**:
   - Should show trigger type, source branch, environment
   - Should confirm successful parameter updates

## Troubleshooting

### If Manual Test Fails:
- Check that `AWS_ACCOUNT_ID` secret is set correctly
- Verify OIDC role exists: `aws iam get-role --role-name github-actions-oidc-role-dev`
- Check workflow logs for specific error messages

### If Automatic Trigger Fails:
- Verify Terraform apply completed successfully
- Check that workflow runs on the correct branch
- Ensure environment detection logic works correctly

### If Environment Detection is Wrong:
- Check branch name in workflow logs
- Verify the environment mapping logic in the workflow

## Success Criteria

✅ **Manual trigger works** with OIDC authentication
✅ **Automatic trigger activates** after Terraform apply success
✅ **Environment detection** correctly maps branch to environment
✅ **SSM parameters** are updated with current Terraform outputs
✅ **Deployment summary** shows accurate information

## Next Steps After Testing

Once testing is successful:
1. Document the new workflow behavior
2. Update any deployment guides
3. Consider setting up the same automation for production (main branch)
4. Monitor the workflow in production for a few cycles
