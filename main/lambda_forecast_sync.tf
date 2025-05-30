# Lambda function for automated forecast data synchronization

# Create Lambda deployment package
data "archive_file" "forecast_sync_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambda/forecast_sync"
  output_path = "${path.module}/../build/forecast_sync_lambda.zip"
}

# Lambda function for forecast sync
module "forecast_sync_lambda" {
  source = "./modules/lambda_function"

  function_name = "forecast-sync-${var.environment}"
  description   = "Automated forecast data synchronization from S3/Athena to Postgres"
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  timeout       = 900 # 15 minutes for large data syncs
  memory_size   = 1024
  zip_file      = data.archive_file.forecast_sync_lambda.output_path

  create_log_group = false

  environment_variables = {
    ATHENA_DB_NAME           = "default"
    ATHENA_OUTPUT_LOCATION   = "s3://${aws_s3_bucket.wyatt-datalake-35315550.id}/athena-results/"
    FORECAST_TABLE_NAME      = "forecast"
    SSM_NEON_API_KEY_PATH    = "/forecast-sync/${var.environment}/neon-api-key"
    SSM_NEON_PROJECT_ID_PATH = "/forecast-sync/${var.environment}/neon-project-id"
    AWS_REGION               = var.aws_region
    BATCH_SIZE               = "10000"
    ENVIRONMENT              = var.environment
  }

  policy_statements = merge(
    local.s3_datalake_policy,
    {
      logs = {
        effect = "Allow"
        actions = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        resources = ["arn:aws:logs:*:*:*"]
      }
      athena = {
        effect = "Allow"
        actions = [
          "athena:StartQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults",
          "athena:GetWorkGroup"
        ]
        resources = [
          "arn:aws:athena:${var.aws_region}:${data.aws_caller_identity.current.account_id}:workgroup/primary",
          "arn:aws:athena:${var.aws_region}:${data.aws_caller_identity.current.account_id}:datacatalog/AwsDataCatalog"
        ]
      }
      glue = {
        effect = "Allow"
        actions = [
          "glue:GetDatabase",
          "glue:GetTable",
          "glue:GetPartitions"
        ]
        resources = [
          "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:catalog",
          "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:database/default",
          "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/default/*"
        ]
      }
      s3_results = {
        effect = "Allow"
        actions = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        resources = [
          "${aws_s3_bucket.wyatt-datalake-35315550.arn}/athena-results/*"
        ]
      }
      secretsmanager = {
        effect = "Allow"
        actions = [
          "secretsmanager:GetSecretValue"
        ]
        resources = [
          "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:neon-*"
        ]
      }
      kms = {
        effect = "Allow"
        actions = [
          "kms:Decrypt"
        ]
        resources = [
          aws_kms_key.s3_key.arn
        ]
      }
      ssm_parameters = {
        effect = "Allow"
        actions = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        resources = [
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/forecast-sync/*"
        ]
      }
      kms_decrypt_ssm = {
        effect = "Allow"
        actions = [
          "kms:Decrypt"
        ]
        resources = [
          "arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:key/*"
        ]
        condition = {
          test     = "StringEquals"
          variable = "kms:ViaService"
          values   = ["ssm.${var.aws_region}.amazonaws.com"]
        }
      }
    }
  )

  tags = {
    Component = "Data Sync"
    Function  = "Forecast Data Synchronization"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "forecast_sync" {
  name              = "/aws/lambda/forecast-sync-${var.environment}"
  retention_in_days = 30

  tags = {
    Component = "Data Sync"
    Function  = "Forecast Sync Logs"
  }
}

# Lambda permission for S3 to invoke the function
resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = module.forecast_sync_lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.wyatt-datalake-35315550.arn
}

# Lambda permission for EventBridge to invoke the function
resource "aws_lambda_permission" "eventbridge_invoke" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.forecast_sync_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.forecast_sync.arn
}

# S3 Event Notification Configuration
resource "aws_s3_bucket_notification" "forecast_updates" {
  bucket = aws_s3_bucket.wyatt-datalake-35315550.id

  lambda_function {
    lambda_function_arn = module.forecast_sync_lambda.function_arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "forecast/"
    filter_suffix       = ".parquet"
  }

  depends_on = [aws_lambda_permission.s3_invoke]
}

# EventBridge rule for forecast sync
resource "aws_cloudwatch_event_rule" "forecast_sync" {
  name        = "forecast-sync-rule-${var.environment}"
  description = "Trigger forecast sync from S3 events"
  state       = "ENABLED"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = {
        name = [aws_s3_bucket.wyatt-datalake-35315550.id]
      }
      object = {
        key = [{
          prefix = "forecast/"
        }]
      }
    }
  })

  tags = {
    Component = "Data Sync"
    Function  = "Forecast Sync Trigger"
  }
}

# EventBridge target for Lambda
resource "aws_cloudwatch_event_target" "forecast_sync" {
  rule      = aws_cloudwatch_event_rule.forecast_sync.name
  target_id = "forecast-sync-lambda"
  arn       = module.forecast_sync_lambda.function_arn
}

# CloudWatch Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "forecast_sync_errors" {
  alarm_name          = "forecast-sync-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors forecast sync lambda errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = module.forecast_sync_lambda.function_name
  }

  alarm_actions = var.sns_alert_topic_arn != "" ? [var.sns_alert_topic_arn] : []

  tags = {
    Component = "Data Sync"
    Function  = "Error Monitoring"
  }
}

# CloudWatch Alarm for Lambda duration
resource "aws_cloudwatch_metric_alarm" "forecast_sync_duration" {
  alarm_name          = "forecast-sync-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "600000" # 10 minutes in milliseconds
  alarm_description   = "This metric monitors forecast sync lambda duration"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = module.forecast_sync_lambda.function_name
  }

  alarm_actions = var.sns_alert_topic_arn != "" ? [var.sns_alert_topic_arn] : []

  tags = {
    Component = "Data Sync"
    Function  = "Performance Monitoring"
  }
}
