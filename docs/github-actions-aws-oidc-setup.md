# GitHub Actions AWS OIDC Configuration Guide

This guide helps you set up AWS OIDC (OpenID Connect) authentication for GitHub Actions, which allows your workflows to assume AWS roles without storing long-lived credentials.

## Prerequisites

1. An AWS account with appropriate permissions to create IAM roles and OIDC providers
2. A GitHub repository where you'll run the workflows
3. GitHub repository settings configured with the necessary secrets

## Step 1: Create the OIDC Provider in AWS

If you haven't already created the GitHub OIDC provider in your AWS account:

```bash
aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

## Step 2: Create the IAM Role

Create an IAM role that GitHub Actions can assume. The trust relationship should look like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:wmjones/wyatt-personal-aws:*"
        },
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
```

**Important Notes:**
- Replace `YOUR_ACCOUNT_ID` with your AWS account ID
- Replace `wmjones/wyatt-personal-aws` with your GitHub organization/repository
- Use `StringLike` with wildcards (`*`) for flexibility, or `StringEquals` for exact matches
- You can restrict to specific branches: `"repo:wmjones/wyatt-personal-aws:ref:refs/heads/main"`

## Step 3: Attach Policies to the Role

Attach the necessary AWS policies to the role. For this project, you'll need:

```bash
# Example policies (adjust based on your needs)
aws iam attach-role-policy \
    --role-name GitHubActionsDeployRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess

aws iam attach-role-policy \
    --role-name GitHubActionsDeployRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Add more policies as needed for your deployment
```

## Step 4: Configure GitHub Secrets

In your GitHub repository settings, add the following secret:

- `AWS_ROLE_ARN`: The ARN of the IAM role created in Step 2
  - Example: `arn:aws:iam::123456789012:role/GitHubActionsDeployRole`

## Step 5: GitHub Actions Workflow Configuration

Your workflow must have the correct permissions and configuration:

```yaml
name: Deploy with AWS OIDC

on:
  push:
    branches: [main, dev]

permissions:
  id-token: write  # Required for OIDC
  contents: read   # Required for checkout

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
        role-session-name: GitHubActionsDeployment
        aws-region: us-east-2
        audience: sts.amazonaws.com
```

## Troubleshooting

### Error: "Could not load credentials from any providers"

1. **Check Permissions**: Ensure your workflow has `id-token: write` permission
2. **Verify Trust Relationship**: Confirm the trust policy matches your repository
3. **Check Role ARN**: Verify the secret `AWS_ROLE_ARN` is correctly set
4. **Session Name**: Avoid using "GitHubActions" as the session name if issues persist
5. **Environment Variables**: Remove any `AWS_PROFILE` environment variables
6. **Token Conflicts**: If using GitHub App tokens, split workflows into multiple jobs

### Common Issues and Solutions

1. **StringLike vs StringEquals**:
   - Use `StringLike` when using wildcards in conditions
   - Use `StringEquals` for exact matches only

2. **Branch Restrictions**:
   ```json
   "StringLike": {
     "token.actions.githubusercontent.com:sub": [
       "repo:wmjones/wyatt-personal-aws:ref:refs/heads/main",
       "repo:wmjones/wyatt-personal-aws:ref:refs/heads/dev"
     ]
   }
   ```

3. **Pull Request Permissions**:
   - PRs from forks won't have access to secrets
   - Consider using `pull_request_target` for fork PRs (with caution)

4. **China Regions**:
   - Use `audience: sts.amazonaws.com.cn` for China regions

## Security Best Practices

1. **Least Privilege**: Only grant the minimum permissions needed
2. **Branch Protection**: Restrict which branches can assume the role
3. **Regular Audits**: Review and rotate credentials regularly
4. **Separate Roles**: Use different roles for dev/prod environments
5. **CloudTrail**: Enable CloudTrail to audit role assumptions

## Example: Multi-Environment Setup

For different environments, create separate roles:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:sub": "repo:wmjones/wyatt-personal-aws:environment:production",
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
```

Then use environment-specific secrets:
- `AWS_ROLE_ARN_DEV`
- `AWS_ROLE_ARN_PROD`

## References

- [GitHub Actions OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [AWS Configure Credentials Action](https://github.com/aws-actions/configure-aws-credentials)
- [AWS IAM OIDC Provider Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
