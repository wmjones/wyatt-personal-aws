# GitHub Actions OIDC Provider and IAM Role Configuration

data "aws_caller_identity" "current" {}

locals {
  github_org       = "wmjones"
  github_repo      = "wyatt-personal-aws"
  allowed_branches = ["main", "dev"] # Branches allowed to assume the role
}

# Try to read existing OIDC provider (might not exist)
data "aws_iam_openid_connect_provider" "github_actions_existing" {
  count = var.environment == "prod" ? 1 : 0
  arn   = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
}

# Create the OIDC Provider for GitHub Actions ONLY in dev environment
# NOTE: This is an account-wide resource shared across all environments.
# We create it only in dev to avoid conflicts when both environments try to create it.
resource "aws_iam_openid_connect_provider" "github_actions" {
  count = var.environment == "dev" ? 1 : 0

  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
  ]

  tags = {
    Name        = "GitHub-Actions-OIDC-Provider"
    Environment = "shared"
    Component   = "CI/CD"
    ManagedBy   = "dev-environment"
  }
}

# Local to get the OIDC provider ARN regardless of which environment we're in
locals {
  oidc_provider_arn = var.environment == "dev" ? aws_iam_openid_connect_provider.github_actions[0].arn : data.aws_iam_openid_connect_provider.github_actions_existing[0].arn
}

# IAM Role for GitHub Actions with necessary permissions
# Only create in dev environment to avoid conflicts
resource "aws_iam_role" "github_actions" {
  count = var.environment == "dev" ? 1 : 0
  name  = "github-actions-role"

  # Trust policy that allows GitHub Actions to assume this role via OIDC
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = local.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              for branch in local.allowed_branches :
              "repo:${local.github_org}/${local.github_repo}:ref:refs/heads/${branch}"
            ]
          }
        }
      }
    ]
  })

  tags = {
    Name        = "GitHub-Actions-OIDC-Role"
    Environment = var.environment
    Component   = "CI/CD"
  }
}

# Permissions policy for GitHub Actions to interact with AWS resources
# Only create in dev environment to avoid conflicts
resource "aws_iam_policy" "github_actions_permissions" {
  count       = var.environment == "dev" ? 1 : 0
  name        = "github-actions-permissions"
  description = "Permissions for GitHub Actions to deploy infrastructure and applications"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # S3 Permissions
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          module.visualization_data_bucket.s3_bucket_arn,
          "${module.visualization_data_bucket.s3_bucket_arn}/*"
        ]
      },
      # S3 ListAllMyBuckets permission for SSM workflow
      {
        Effect = "Allow"
        Action = [
          "s3:ListAllMyBuckets",
          "s3:GetBucketLocation"
        ]
        Resource = "*"
      },
      # CloudFront permissions for SSM workflow (even though React app deprecated, workflow still checks)
      {
        Effect = "Allow"
        Action = [
          "cloudfront:ListDistributions"
        ]
        Resource = "*"
      },
      # SSM Parameter Permissions
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:PutParameter",
          "ssm:ListParameters"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/wyatt-personal-aws-*"
      },
      # Terraform State Access (if using S3 backend)
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/terraform-state-lock-*"
      },
      # Lambda Deployment Permissions
      {
        Effect = "Allow"
        Action = [
          "lambda:GetFunction",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:ListFunctions"
        ]
        Resource = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:*"
      }
    ]
  })
}

# Attach the permissions policy to the GitHub Actions role
resource "aws_iam_role_policy_attachment" "github_actions_permissions" {
  count      = var.environment == "dev" ? 1 : 0
  role       = aws_iam_role.github_actions[0].name
  policy_arn = aws_iam_policy.github_actions_permissions[0].arn
}

# Add outputs to make it easy to use the role ARN in GitHub secrets
output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions OIDC authentication"
  value       = var.environment == "dev" ? aws_iam_role.github_actions[0].arn : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/github-actions-role"
}

output "github_actions_oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC provider"
  value       = local.oidc_provider_arn
}
