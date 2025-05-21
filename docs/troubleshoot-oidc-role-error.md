# Troubleshooting AWS OIDC Role Error

## Error: "Source Account ID is needed if the Role Name is provided and not the Role Arn"

This error typically occurs when the GitHub Actions workflow receives a role name instead of a complete ARN, or when the IAM role hasn't been created yet.

## Steps to Fix

### 1. Apply Terraform Changes First

Make sure you've applied the Terraform changes to create the IAM role:

```bash
cd main
terraform init
terraform apply
```

### 2. Get the Correct Role ARN

After applying Terraform, get the role ARN:

```bash
terraform output github_actions_role_arn
```

This should output something like:
```
"arn:aws:iam::123456789012:role/github-actions-oidc-role-dev"
```

### 3. Verify the GitHub Secret Format

The AWS_ROLE_ARN secret should contain the **complete ARN**, not just the role name.

**Correct format:**
```
arn:aws:iam::123456789012:role/github-actions-oidc-role-dev
```

**Incorrect format (causes the error):**
```
github-actions-oidc-role-dev
```

### 4. Update GitHub Secret

1. Go to GitHub repository Settings
2. Navigate to "Secrets and variables" > "Actions"
3. Find the `AWS_ROLE_ARN` secret
4. Click "Update" and paste the complete ARN from step 2
5. Save the secret

### 5. Test the Workflow

Run the workflow again to verify the fix:

1. Go to Actions tab in your repository
2. Select the "Configure SSM Parameters for Deployment" workflow
3. Click "Run workflow"
4. Select the environment (dev/prod)
5. Run the workflow

## Alternative: Check if Role Exists

If you're unsure whether the role exists, you can check via AWS CLI:

```bash
aws iam get-role --role-name github-actions-oidc-role-dev
```

If this returns an error, the role doesn't exist and you need to apply the Terraform changes first.

## Common Mistakes

1. **Using role name instead of ARN**: The secret must contain the full ARN
2. **Not applying Terraform**: The role must be created before using it
3. **Wrong environment**: Make sure you're using the correct environment-specific role ARN
4. **Typos in ARN**: Double-check the ARN format and account ID
