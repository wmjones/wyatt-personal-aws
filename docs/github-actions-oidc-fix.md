# Fixing AWS OIDC Configuration in GitHub Actions

## Issue Identified

The error in the GitHub Actions workflow is related to the AWS OIDC (OpenID Connect) configuration:

```yaml
Run aws-actions/configure-aws-credentials@v4
with:
  role-session-name: GitHubActionsDeployment
  aws-region: us-east-2
  audience: sts.amazonaws.com
env:
  AWS_REGION: us-east-2
```

## Problem Analysis

The workflow is attempting to use OIDC for authentication with AWS, but appears to be missing the required `role-to-assume` parameter. When using OIDC, this parameter is mandatory as it specifies which IAM role in AWS to assume using the JWT token from GitHub.

Additionally, the workflow requires the proper permissions to request the JWT token from GitHub's OIDC provider.

## Solution

### 1. Update GitHub Actions Workflow

Update the GitHub Actions workflow with the following changes:

```yaml
permissions:
  id-token: write  # Required for OIDC authentication
  contents: read   # Required for actions/checkout

jobs:
  deploy:
    # ... other configurations ...
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}  # IAM role ARN to assume
          role-session-name: GitHubActionsDeployment
          aws-region: us-east-2
          audience: sts.amazonaws.com  # Standard audience for AWS STS
```

### 2. Create Required IAM Resources in AWS

1. **Create an OIDC Identity Provider**:
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

2. **Create an IAM Role with Trust Policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:wmjones/wyatt-personal-aws:*"
        }
      }
    }
  ]
}
```

3. **Add Required Permissions to the Role**:
   Attach policies based on what the workflow needs to do (e.g., S3, CloudFront, SSM access).

4. **Configure Secret in GitHub Repository**:
   - Create a new repository secret named `AWS_ROLE_ARN`
   - Set the value to the ARN of the created IAM role: `arn:aws:iam::<AWS_ACCOUNT_ID>:role/<ROLE_NAME>`

### 3. Additional Considerations

1. Fine-tune the trust policy condition to restrict the role to specific branches or workflows if needed.
2. Ensure the role has the minimum permissions necessary (principle of least privilege).
3. Consider setting up separate roles for different environments (dev/prod).

## Verification

After implementing these changes, verify the setup by:

1. Running the workflow and checking for successful authentication
2. Running `aws sts get-caller-identity` in the workflow to confirm the assumed role
3. Confirming that the workflow can access required AWS resources

## Future Recommendations

1. Consider narrowing down the trust policy's `sub` condition to specific branches for enhanced security.
2. Implement regular rotation of the OIDC provider's thumbprint if required by your security policies.
3. Monitor OIDC token usage through AWS CloudTrail for audit purposes.
