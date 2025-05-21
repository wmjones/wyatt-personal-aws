# AWS IAM OIDC Configuration for GitHub Actions

This document guides you through setting up AWS IAM for OIDC authentication with GitHub Actions.

## 1. Create an OIDC Identity Provider

1. Log in to the AWS Management Console and navigate to IAM.
2. In the left navigation menu, select **Identity providers**.
3. Click **Add provider**.
4. In the Provider configuration section:
   - For Provider type, select **OpenID Connect**.
   - For Provider URL, enter `https://token.actions.githubusercontent.com` (ensure the URL is validated successfully).
   - For Audience, enter `sts.amazonaws.com`.
5. Click **Add provider**.

## 2. Create an IAM Role for GitHub Actions

1. In the IAM console, navigate to **Roles** and click **Create role**.
2. Under Trusted entity type, select **Web identity**.
3. Under Identity provider, select the GitHub OIDC provider you created.
4. For Audience, select `sts.amazonaws.com`.
5. (Optional) Add conditions to restrict access further:
   - Click **Add condition** to restrict by repository/branch.
   - For Condition, select `StringLike`.
   - For Key, enter `token.actions.githubusercontent.com:sub`.
   - For Value, enter `repo:wmjones/wyatt-personal-aws:*` to allow all branches, or more specific values like `repo:wmjones/wyatt-personal-aws:ref:refs/heads/main` for a specific branch.
6. Click **Next** to add permissions.
7. Attach the necessary policies based on what your GitHub Actions need to do (e.g., AmazonS3FullAccess, CloudFrontFullAccess, etc.).
8. Click **Next**, provide a role name (e.g., "GitHubActionsOIDCRole"), and create the role.

## 3. Advanced Trust Policy (Optional)

If you need more granular control, you can edit the trust policy directly. Here's an example:

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
          "token.actions.githubusercontent.com:sub": [
            "repo:wmjones/wyatt-personal-aws:ref:refs/heads/main",
            "repo:wmjones/wyatt-personal-aws:ref:refs/heads/dev"
          ]
        }
      }
    }
  ]
}
```

## 4. Restrict by Environment (Optional)

For enhanced security, you can create environment-specific roles:

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
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:wmjones/wyatt-personal-aws:environment:Production"
        }
      }
    }
  ]
}
```

## 5. Add Role ARN to GitHub Secrets

1. In your GitHub repository, navigate to Settings > Secrets and variables > Actions.
2. Create a new repository secret:
   - Name: `AWS_ROLE_ARN`
   - Value: `arn:aws:iam::<AWS_ACCOUNT_ID>:role/<ROLE_NAME>` (replace with your actual ARN)
3. Click **Add secret**.

## 6. Security Best Practices

1. **Least Privilege**: Grant the minimum permissions necessary for your workflows.
2. **Branch Restrictions**: Restrict role assumption to specific branches when possible.
3. **Audit Logs**: Enable AWS CloudTrail for monitoring OIDC token usage.
4. **Regular Review**: Periodically review IAM roles and permissions.

## 7. Troubleshooting

- **Invalid token audience**: Ensure the audience in your GitHub workflow matches the one in your IAM trust policy.
- **Invalid subject**: Check that the repository/branch condition in your trust policy matches your GitHub repo structure.
- **Permission denied**: Verify that the assumed role has the necessary permissions for your workflow actions.

## 8. Verification

To verify your OIDC setup is working, add this step to your workflow:

```yaml
- name: Verify AWS Identity
  run: aws sts get-caller-identity
```

This will output the assumed role information if authentication is successful.
