data "aws_partition" "current" {}

# Dedicated EventBridge role for invoking Step Functions
resource "aws_iam_role" "eventbridge_role" {
  name = "eventbridge_role_${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "events.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Component   = "IAM"
  }
}

resource "aws_iam_role_policy" "eventbridge_policy" {
  name = "eventbridge_policy"
  role = aws_iam_role.eventbridge_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "states:StartExecution"
        Resource = module.todoist_workflow.state_machine_arn
      }
    ]
  })
}

resource "aws_iam_role" "lambda_role" {
  name = "lambda_exec_role_${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      },
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { AWS = aws_iam_role.sfn_role.arn }
      },
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "states.amazonaws.com" }
      },
    ]
  })

  tags = {
    Environment = var.environment
    Component   = "IAM"
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "lambda_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = ["s3:PutObject", "s3:GetObject"]
        Effect = "Allow"
        # Needs interpolation because of the "/*" suffix
        Resource = "${aws_s3_bucket.wyatt-datalake-35315550.arn}/*"
      },
      {
        Action   = "logs:*"
        Effect   = "Allow"
        Resource = "*"
      },
      # ——— Fixed interpolation-only expressions ———
      {
        Action   = "lambda:InvokeFunction"
        Effect   = "Allow"
        Resource = module.todoist_lambda.function_arn
      },
      {
        Action   = "lambda:InvokeFunction"
        Effect   = "Allow"
        Resource = module.chatgpt_lambda.function_arn
      },
      {
        Action   = "lambda:InvokeFunction"
        Effect   = "Allow"
        Resource = module.notion_lambda.function_arn
      },
      {
        Action   = "lambda:InvokeFunction"
        Effect   = "Allow"
        Resource = module.put_todoist_lambda.function_arn
      },
      {
        Action   = "secretsmanager:GetSecretValue"
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_role" "sfn_role" {
  name = "sfn_execution_role_${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "scheduler.amazonaws.com" }
        Action    = "sts:AssumeRole"
      },
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "states.amazonaws.com" }
      },
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "events.amazonaws.com" }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Component   = "IAM"
  }
}

resource "aws_iam_role_policy" "sfn_policy" {
  name = "sfn_policy"
  role = aws_iam_role.sfn_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "states:StartExecution"
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action   = "logs:CreateLogGroup"
        Effect   = "Allow"
        Resource = "arn:${data.aws_partition.current.partition}:logs:*:*:*"
      },
      # More specific Lambda permissions
      {
        Effect   = "Allow"
        Action   = ["lambda:InvokeFunction", "lambda:GetFunction"]
        Resource = "arn:${data.aws_partition.current.partition}:lambda:*:*:function:*"
      }
    ]
  })
}
