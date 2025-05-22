## Athena Resources for Forecast Data Analysis

# Create an S3 bucket for Athena query results
resource "aws_s3_bucket" "athena_results" {
  bucket = "${var.project_name}-athena-results-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "Athena Query Results"
    Environment = var.environment
    Component   = "Data Analytics"
  }
}

# Block public access to Athena results bucket
resource "aws_s3_bucket_public_access_block" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption for Athena results
resource "aws_s3_bucket_server_side_encryption_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Create Athena workgroup
resource "aws_athena_workgroup" "forecast_analysis" {
  name = "${var.project_name}-forecast-analysis-${var.environment}"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.bucket}/query-results/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = aws_kms_key.s3_key.arn
      }
    }
  }

  tags = {
    Name        = "Forecast Analysis Workgroup"
    Environment = var.environment
    Component   = "Data Analytics"
  }
}

# Create Athena database
resource "aws_athena_database" "forecast_db" {
  name   = "forecast_data_${var.environment}"
  bucket = aws_s3_bucket.athena_results.id

  force_destroy = true

  encryption_configuration {
    encryption_option = "SSE_KMS"
    kms_key           = aws_kms_key.s3_key.arn
  }
}

# Create an IAM policy for Athena access
resource "aws_iam_policy" "athena_access" {
  name        = "${var.project_name}-athena-access-${var.environment}"
  description = "Policy for Athena access to S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "athena:StartQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults",
          "athena:StopQueryExecution",
          "athena:GetWorkGroup"
        ]
        Resource = [
          aws_athena_workgroup.forecast_analysis.arn,
          "arn:aws:athena:${var.aws_region}:${data.aws_caller_identity.current.account_id}:database/${aws_athena_database.forecast_db.name}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:ListMultipartUploadParts",
          "s3:AbortMultipartUpload",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.wyatt-datalake-35315550.arn,
          "${aws_s3_bucket.wyatt-datalake-35315550.arn}/*",
          aws_s3_bucket.athena_results.arn,
          "${aws_s3_bucket.athena_results.arn}/*"
        ]
      }
    ]
  })
}

# Create a Lambda function for interacting with Athena
resource "aws_lambda_function" "athena_query" {
  function_name = "${var.project_name}-athena-query-${var.environment}"
  role          = aws_iam_role.athena_lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30
  memory_size   = 256

  filename         = local.lambda_zip_path
  source_code_hash = filebase64sha256(local.lambda_zip_path)

  environment {
    variables = {
      ATHENA_DB_NAME      = aws_athena_database.forecast_db.name
      ATHENA_WORKGROUP    = aws_athena_workgroup.forecast_analysis.name
      OUTPUT_LOCATION     = "s3://${aws_s3_bucket.athena_results.bucket}/query-results/"
      DATA_BUCKET         = aws_s3_bucket.wyatt-datalake-35315550.bucket
      DATA_FOLDER         = "forecast_data"
      FORECAST_TABLE_NAME = "forecast"
    }
  }
}

# Create an IAM role for the Lambda function
resource "aws_iam_role" "athena_lambda_role" {
  name = "${var.project_name}-athena-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# Attach the Athena access policy to the Lambda role
resource "aws_iam_role_policy_attachment" "athena_lambda_policy" {
  role       = aws_iam_role.athena_lambda_role.name
  policy_arn = aws_iam_policy.athena_access.arn
}

# Attach basic Lambda execution role (for CloudWatch logs)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.athena_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# API Gateway integration for Athena query Lambda
resource "aws_apigatewayv2_integration" "athena_query" {
  api_id                 = module.api_gateway.api_id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.athena_query.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# API Gateway route for Athena queries
resource "aws_apigatewayv2_route" "athena_query" {
  api_id    = module.api_gateway.api_id
  route_key = "POST /api/data/athena/query"
  target    = "integrations/${aws_apigatewayv2_integration.athena_query.id}"
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "athena_query_api" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.athena_query.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.execution_arn}/*/*/api/data/athena/query"
}

# Outputs
output "athena_database_name" {
  description = "The name of the Athena database"
  value       = aws_athena_database.forecast_db.name
}

output "athena_workgroup_name" {
  description = "The name of the Athena workgroup"
  value       = aws_athena_workgroup.forecast_analysis.name
}

output "athena_query_lambda_arn" {
  description = "The ARN of the Athena query Lambda function"
  value       = aws_lambda_function.athena_query.arn
}

output "athena_results_bucket" {
  description = "The S3 bucket for Athena query results"
  value       = aws_s3_bucket.athena_results.bucket
}
