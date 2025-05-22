# Fix for OIDC Provider Already Exists Error

## Problem

When running `terraform apply` on the main branch, you may encounter this error:

```
Error: creating IAM OIDC Provider: operation error IAM: CreateOpenIDConnectProvider,
https response error StatusCode: 409, RequestID: 18807438-d4c3-4ab8-af1d-633cb7622cd3,
EntityAlreadyExists: Provider with url https://token.actions.githubusercontent.com already exists.
```

This happens because:
1. The GitHub Actions OIDC provider is an AWS account-wide resource
2. It may have been created by another Terraform workspace or manually
3. Terraform doesn't know about the existing resource in its state

## Solution

### Option 1: Run the Fix Script (Recommended)

We've provided a script that automatically handles the import:

```bash
./scripts/fix-oidc-provider.sh
```

This script will:
1. Check if the OIDC provider exists in your AWS account
2. Import it into both dev and prod Terraform workspaces
3. Verify the import was successful

### Option 2: Manual Import

If you prefer to import manually:

1. Get your AWS account ID:
   ```bash
   aws sts get-caller-identity --query Account --output text
   ```

2. Navigate to the main directory:
   ```bash
   cd main
   ```

3. For each workspace, import the OIDC provider:
   ```bash
   # For dev workspace
   terraform workspace select wyatt-personal-aws-dev
   terraform import aws_iam_openid_connect_provider.github_actions \
     arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com

   # For prod workspace
   terraform workspace select wyatt-personal-aws-prod
   terraform import aws_iam_openid_connect_provider.github_actions \
     arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com
   ```

## Prevention

The `github_actions_oidc.tf` file includes:
- Clear documentation about this being an account-wide resource
- Instructions for importing if the resource already exists
- A lifecycle rule to prevent accidental recreation

## Verification

After running the fix:

1. Run `terraform plan` to ensure no changes are needed for the OIDC provider
2. The plan should show no changes for `aws_iam_openid_connect_provider.github_actions`
3. You can proceed with `terraform apply` for other resources

## Notes

- The OIDC provider is shared across all environments in your AWS account
- The thumbprint values are AWS-provided and shouldn't be changed
- The IAM roles are environment-specific (dev/prod) even though the provider is shared
