# Fix for IAM OIDC Provider Already Exists Error

## Problem

When running `terraform apply` from the main branch, you may encounter this error:

```
Error: creating IAM OIDC Provider: operation error IAM: CreateOpenIDConnectProvider,
https response error StatusCode: 409, RequestID: 18807438-d4c3-4ab8-af1d-633cb7622cd3,
EntityAlreadyExists: Provider with url https://token.actions.githubusercontent.com already exists.
```

This happens because:
1. OIDC providers are account-wide resources (not environment-specific)
2. The provider was already created in a previous deployment
3. Terraform doesn't know about the existing resource

## Solution

### Option 1: Import Existing Provider (Recommended)

Run the provided script to import the existing OIDC provider:

```bash
./scripts/fix-oidc-provider.sh
```

This script will:
1. Check if the OIDC provider exists
2. Import it into Terraform state for all workspaces
3. Allow you to continue with terraform apply

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

3. Import the OIDC provider:
   ```bash
   terraform import aws_iam_openid_connect_provider.github_actions \
     arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com
   ```

4. Run terraform plan to verify:
   ```bash
   terraform plan
   ```

### Option 3: Delete and Recreate

If you want to start fresh (use with caution):

1. Delete the existing OIDC provider:
   ```bash
   aws iam delete-open-id-connect-provider \
     --open-id-connect-provider-arn arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com
   ```

2. Run terraform apply:
   ```bash
   terraform apply
   ```

## Prevention

To prevent this issue in the future:
- Always import existing account-wide resources before applying
- Consider using data sources for shared resources
- Document which resources are account-wide vs environment-specific

## Related Files

- `main/github_actions_oidc.tf` - The OIDC provider configuration
- `scripts/fix-oidc-provider.sh` - Automated fix script
