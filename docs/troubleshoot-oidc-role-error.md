# Troubleshooting AWS OIDC Role Errors

## Error: "Could not load credentials from any providers"

This error indicates that GitHub Actions cannot authenticate with AWS using OIDC. This typically happens when:
- The OIDC provider is not set up in AWS
- The IAM role doesn't exist or has incorrect trust policies
- GitHub secrets are missing or incorrect
- The OIDC trust relationship is not properly configured

## Error: "Source Account ID is needed if the Role Name is provided and not the Role Arn"

This error typically occurs when the GitHub Actions workflow receives a role name instead of a complete ARN, or when the IAM role hasn't been created yet.

## Steps to Fix "Could not load credentials from any providers"

### 1. Verify GitHub Secrets are Set

Check that these secrets exist in your GitHub repository:

```
AWS_ACCOUNT_ID = 761551243560
```

**To check/add secrets:**
1. Go to GitHub repository Settings
2. Navigate to "Secrets and variables" > "Actions"
3. Verify `AWS_ACCOUNT_ID` secret exists with correct value

### 2. Apply Terraform Changes to Create OIDC Resources

The OIDC provider and IAM role must exist before GitHub Actions can authenticate:

```bash
cd main
terraform init
terraform apply
```

This will create:
- GitHub OIDC identity provider in AWS
- IAM role with proper trust policy
- Required permissions for the role

### 3. Verify OIDC Provider Exists

Check if the OIDC provider was created:

```bash
aws iam list-open-id-connect-providers
```

You should see an entry for `token.actions.githubusercontent.com`

### 4. Verify IAM Role Exists

Check if the GitHub Actions role was created:

```bash
aws iam get-role --role-name github-actions-oidc-role-dev
```

### 5. Check Role Trust Policy

Verify the role trust policy allows GitHub Actions:

```bash
aws iam get-role --role-name github-actions-oidc-role-dev --query 'Role.AssumeRolePolicyDocument'
```

The policy should include your repository in the subject condition.

### 6. Check Branch Restrictions

If the role exists but you still get "Could not load credentials", check if the trust policy restricts specific branches:

```bash
aws iam get-role --role-name github-actions-oidc-role-dev --query 'Role.AssumeRolePolicyDocument.Statement[0].Condition.StringLike'
```

The current trust policy only allows these branches:
- `repo:wmjones/wyatt-personal-aws:ref:refs/heads/main`
- `repo:wmjones/wyatt-personal-aws:ref:refs/heads/dev`

**If you're running from a feature branch, you have two options:**

**Option A: Update trust policy to allow all branches (recommended for development):**
```bash
# This requires updating the Terraform configuration
```

**Option B: Run workflow only from allowed branches (main or dev)**

## Steps to Fix "Source Account ID" Error

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
