resource "aws_s3_bucket" "wyatt-datalake-35315550" {
  bucket = "step-function-bucket-35315550"

  # Block public access
}

# Block public access settings for the bucket
resource "aws_s3_bucket_public_access_block" "wyatt_datalake_35315550" {
  bucket = aws_s3_bucket.wyatt-datalake-35315550.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Create KMS key for S3 encryption
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  # Add policy to allow CloudFront to use the key
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudFront to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = module.frontend.cloudfront_distribution_arn
          }
        }
      }
    ]
  })

  tags = {
    Component = "Security"
    Name      = "S3 Encryption Key"
  }
}

# Add a human-readable alias for the KMS key
resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/${var.project_name}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

# Server‑side encryption with KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "wyatt_datalake_35315550" {
  bucket = aws_s3_bucket.wyatt-datalake-35315550.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Generate random suffix for bucket name to ensure uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

module "visualization_data_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 3.0"

  bucket = "wyatt-visualization-data-${random_id.bucket_suffix.hex}"

  # Block public access when using Cognito + API Gateway
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  # Enable versioning for data protection
  versioning = {
    enabled = true
  }

  # Server-side encryption with customer managed KMS key for improved security
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        kms_master_key_id = aws_kms_key.s3_key.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }

  # Attach the IAM policy document for authenticated access
  attach_policy = true
  policy        = data.aws_iam_policy_document.visualization_data_policy.json

  # CORS configuration
  cors_rule = [
    {
      allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
      allowed_origins = ["https://${var.app_prefix}.${var.domain_name}", "http://localhost:3000"]
      allowed_headers = ["*"]
      expose_headers  = ["ETag"]
      max_age_seconds = 3000
    }
  ]

  # Optional lifecycle rules for managing storage costs
  lifecycle_rule = [
    {
      id      = "transition-to-ia"
      enabled = true

      filter = {
        prefix = ""
      }

      transition = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        }
      ]
    }
  ]

  tags = {
    Component = "D3 Dashboard"
    Name      = "Visualization Data"
  }
}

# Policy document for access by authenticated users
# Used to manage bucket access policies for visualization data
data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "visualization_data_policy" {
  # Allow authenticated users to access their own objects
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]

    resources = [
      "${module.visualization_data_bucket.s3_bucket_arn}/$${cognito-identity.amazonaws.com:sub}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:PrincipalTag/sub"
      values   = ["$${cognito-identity.amazonaws.com:sub}"]
    }
  }
}
