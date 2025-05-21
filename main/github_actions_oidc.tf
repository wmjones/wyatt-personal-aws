# GitHub Actions OIDC Provider and IAM Role Configuration

data "aws_caller_identity" "current" {}

locals {
  github_org       = "wmjones"
  github_repo      = "wyatt-personal-aws"
  allowed_branches = ["main", "dev"] # Branches allowed to assume the role
}

# Create the OIDC Provider for GitHub Actions
resource "aws_iam_openid_connect_provider" "github_actions" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
  ]

  tags = {
    Name        = "GitHub-Actions-OIDC-Provider"
    Environment = var.environment
    Component   = "CI/CD"
  }
}

# IAM Role for GitHub Actions with necessary permissions
resource "aws_iam_role" "github_actions" {
  name = "github-actions-oidc-role-${var.environment}"

  # Trust policy that allows GitHub Actions to assume this role via OIDC
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
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
resource "aws_iam_policy" "github_actions_permissions" {
  name        = "github-actions-permissions-${var.environment}"
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
          module.frontend.bucket_arn,
          "${module.frontend.bucket_arn}/*",
          module.visualization_data_bucket.s3_bucket_arn,
          "${module.visualization_data_bucket.s3_bucket_arn}/*"
        ]
      },
      # CloudFront Permissions
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetDistribution",
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
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_actions_permissions.arn
}

# Add outputs to make it easy to use the role ARN in GitHub secrets
output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions OIDC authentication"
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC provider"
  value       = aws_iam_openid_connect_provider.github_actions.arn
}
