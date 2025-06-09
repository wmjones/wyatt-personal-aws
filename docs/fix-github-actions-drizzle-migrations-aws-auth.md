# Fix GitHub Actions Drizzle Migrations AWS Authentication

## Issue Summary

The drizzle-migrations.yml workflow is failing with the error:
```
Error: Credentials could not be loaded, please check your action inputs: Could not load credentials from any providers
```

This occurs when the workflow tries to configure AWS credentials to access SSM parameters for database URLs.

## Root Causes Identified

1. **Missing `audience` parameter**: The aws-actions/configure-aws-credentials@v4 action was missing the required `audience: sts.amazonaws.com` parameter for OIDC authentication.

2. **Missing workflow permissions**: The workflow was missing the required permissions section with `id-token: write` which is necessary for GitHub Actions to request OIDC tokens.

3. **IAM role configuration**: The workflow needs to use the correct IAM role ARN format and ensure the role has the necessary permissions.

## Changes Made

### 1. Updated drizzle-migrations.yml

Added the required permissions section:
```yaml
permissions:
  contents: read    # Required for actions/checkout
  id-token: write   # Required for OIDC authentication with AWS
```

Updated the AWS credentials configuration:
```yaml
- name: Configure AWS credentials
  if: matrix.environment != 'preview'
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-role
    role-session-name: GitHubActionsDrizzleMigrations
    aws-region: us-east-2
    audience: sts.amazonaws.com
```

### 2. Updated IAM Permissions

Added SSM parameter permissions for Neon database URLs in github_actions_oidc.tf:
```hcl
Resource = [
  "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/wyatt-personal-aws-*",
  "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/forecast-sync/*",
  "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/nextjs/*/neon/database-url"
]
```

## Required GitHub Secrets

Ensure the following secret is configured in your GitHub repository settings:
- `AWS_ACCOUNT_ID`: Your AWS account ID (12-digit number)

## Important Notes

1. **Branch Restrictions**: The current IAM role trust policy only allows the `main` and `dev` branches to assume the role. If you need to run migrations from feature branches, you'll need to update the trust policy in github_actions_oidc.tf.

2. **Environment-specific Role**: The github-actions-role is only created in the dev environment according to the Terraform configuration. For production, you may need a separate role or to adjust the Terraform configuration.

3. **SSM Parameter Naming**: The workflow expects SSM parameters to follow the pattern `/nextjs/{environment}/neon/database-url`. Ensure these parameters exist in AWS Systems Manager.

## Next Steps

1. **Apply Terraform Changes**: Run Terraform apply to update the IAM role permissions:
   ```bash
   cd main
   terraform apply
   ```

2. **Verify GitHub Secret**: Ensure `AWS_ACCOUNT_ID` is set in your GitHub repository secrets.

3. **Test the Workflow**: Re-run the drizzle-migrations workflow to verify the authentication works.

## Troubleshooting

If issues persist:

1. **Check CloudTrail**: Look for AssumeRoleWithWebIdentity events to see if the authentication attempt is reaching AWS.

2. **Verify Trust Policy**: Ensure the IAM role's trust policy includes your repository and branch:
   ```json
   "StringLike": {
     "token.actions.githubusercontent.com:sub": [
       "repo:wmjones/wyatt-personal-aws:ref:refs/heads/dev",
       "repo:wmjones/wyatt-personal-aws:ref:refs/heads/main"
     ]
   }
   ```

3. **Check SSM Parameters**: Verify the database URL parameters exist:
   ```bash
   aws ssm get-parameter --name "/nextjs/dev/neon/database-url" --with-decryption
   ```

4. **Session Name**: If you see errors about the session name, try using a different value than "GitHubActions" as some AWS services have restrictions on this name.
