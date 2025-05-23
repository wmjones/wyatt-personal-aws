# Lambda function for dynamic CORS handling
module "cors_handler" {
  source = "./modules/lambda_function"
  count  = var.environment == "dev" ? 1 : 0

  function_name    = "cors-handler-${var.environment}"
  description      = "Handles CORS preflight requests dynamically"
  runtime          = var.lambda_runtime
  handler          = "cors_handler.lambda_handler"
  zip_file         = local.lambda_zip_path
  create_log_group = false

  environment_variables = {
    ENVIRONMENT       = var.environment
    PROJECT_NAME      = var.project_name
    PRODUCTION_DOMAIN = "${var.app_prefix}.${var.domain_name}"
  }

  policy_statements = {
    logs = {
      effect    = "Allow"
      actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      resources = ["arn:aws:logs:*:*:*"]
    }
  }

  tags = {
    Component = "API CORS Handler"
    Name      = "CORS Handler Lambda"
  }
}

# IAM role for CORS Lambda
resource "aws_iam_role" "cors_lambda_role" {
  name = "cors-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Component = "API CORS Handler"
    Name      = "CORS Lambda Role"
  }
}

# Attach basic execution role
resource "aws_iam_role_policy_attachment" "cors_lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.cors_lambda_role.name
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway_cors" {
  count         = var.environment == "dev" ? 1 : 0
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = module.cors_handler[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.api_arn}/*"
}
