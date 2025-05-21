# Setting Up GitHub Actions OIDC Authentication with AWS

This document provides instructions for setting up OIDC (OpenID Connect) authentication between GitHub Actions and AWS.

## Overview

OIDC authentication provides a more secure way to authenticate GitHub Actions workflows with AWS, without storing long-lived AWS credentials in GitHub secrets. Instead, workflows obtain short-lived AWS credentials by assuming an IAM role through OIDC.

## Prerequisites

- Access to AWS account with permissions to apply Terraform changes
- Administrator access to the GitHub repository

## Steps to Set Up OIDC Authentication

### 1. Apply Terraform Changes

The OIDC provider and IAM role have been configured in `main/github_actions_oidc.tf`. To set up the required AWS resources:

```bash
cd main
terraform init
terraform apply
```

### 2. Get the Role ARN

After applying the Terraform changes, get the IAM role ARN from the Terraform outputs:

```bash
terraform output github_actions_role_arn
```

This will output something like:
```
"arn:aws:iam::123456789012:role/github-actions-oidc-role-dev"
```

### 3. Add Role ARN to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/wmjones/wyatt-personal-aws`
2. Navigate to "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Set the name to `AWS_ROLE_ARN`
5. Set the value to the role ARN from step 2
6. Click "Add secret"

### 4. Verify the GitHub Actions Workflow

The workflow at `.github/workflows/ssm_params.yml` has been updated to use OIDC authentication. The key changes are:

```yaml
permissions:
  contents: read   # Required for actions/checkout
  id-token: write  # Required for OIDC authentication

# ...

- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    role-session-name: GitHubActionsDeployment
    aws-region: ${{ env.AWS_REGION }}
    audience: sts.amazonaws.com
```

## Troubleshooting

If you encounter authentication issues:

1. **Check Logs**: Look at the GitHub Actions workflow logs for specific error messages.

2. **Verify IAM Role Trust Policy**: Ensure the trust policy has the correct GitHub organization and repository name.

3. **Check OIDC Configuration**: Verify the OIDC provider is correctly set up with both required thumbprints:
   - `6938fd4d98bab03faadb97b34396831e3780aea1`
   - `1c58a3a8518e8759bf075b76b750d4f2df264fcd`

4. **Test AWS Credentials**: Add this step to your workflow to verify the credentials:
   ```yaml
   - name: Verify AWS Identity
     run: aws sts get-caller-identity
   ```

## Security Considerations

- The IAM role has been configured with the principle of least privilege, granting only the permissions needed for the GitHub Actions workflows.
- The trust policy restricts role assumption to specific branches of your repository for enhanced security.
- Consider further restricting the trust policy based on your organization's security requirements.

## More Information

- [GitHub Actions OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS IAM OIDC Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
