locals {
  lambda_zip_path = "${path.module}/deployment_package.zip"

  # Common lambda policy statements
  s3_datalake_policy = {
    s3_access = {
      effect    = "Allow"
      actions   = ["s3:PutObject", "s3:GetObject"]
      resources = ["${aws_s3_bucket.wyatt-datalake-35315550.arn}/*"]
    }
  }

  # Common environment variables
  common_env_vars = {
    S3_BUCKET_NAME = aws_s3_bucket.wyatt-datalake-35315550.bucket
  }
}

module "todoist_lambda" {
  source = "./modules/lambda_function"

  function_name    = "todoist_lambda"
  description      = "Lambda function to get incomplete tasks from Todoist"
  handler          = "getTodoist.lambda_handler"
  runtime          = "python3.12"
  timeout          = 10
  zip_file         = local.lambda_zip_path
  create_log_group = false

  environment_variables = local.common_env_vars

  policy_statements = merge(local.s3_datalake_policy, {
    logs = {
      effect    = "Allow"
      actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      resources = ["arn:aws:logs:*:*:*"]
    },
    secrets_manager = {
      effect    = "Allow"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = ["*"]
    }
  })

  tags = {
    Component = "Productivity System"
    Function  = "Todoist Integration"
  }
}

module "chatgpt_lambda" {
  source = "./modules/lambda_function"

  function_name    = "ChatGPT_lambda"
  description      = "Lambda function to process tasks with ChatGPT"
  handler          = "putChatGPT.lambda_handler"
  runtime          = "python3.12"
  timeout          = 15
  zip_file         = local.lambda_zip_path
  create_log_group = false

  environment_variables = local.common_env_vars

  policy_statements = merge(local.s3_datalake_policy, {
    logs = {
      effect    = "Allow"
      actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      resources = ["arn:aws:logs:*:*:*"]
    },
    secrets_manager = {
      effect    = "Allow"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = ["*"]
    }
  })

  tags = {
    Component = "Productivity System"
    Function  = "ChatGPT Integration"
  }
}

module "notion_lambda" {
  source = "./modules/lambda_function"

  function_name    = "notion_lambda"
  description      = "Lambda function to create pages in Notion"
  handler          = "putNotion.lambda_handler"
  runtime          = "python3.12"
  timeout          = 10
  zip_file         = local.lambda_zip_path
  create_log_group = false

  environment_variables = local.common_env_vars

  policy_statements = merge(local.s3_datalake_policy, {
    logs = {
      effect    = "Allow"
      actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      resources = ["arn:aws:logs:*:*:*"]
    },
    secrets_manager = {
      effect    = "Allow"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = ["*"]
    }
  })

  tags = {
    Component = "Productivity System"
    Function  = "Notion Integration"
  }
}

module "put_todoist_lambda" {
  source = "./modules/lambda_function"

  function_name    = "put_todoist_lambda"
  description      = "Lambda function to update tasks in Todoist"
  handler          = "putTodoist.lambda_handler"
  runtime          = "python3.12"
  timeout          = 10
  zip_file         = local.lambda_zip_path
  create_log_group = false

  environment_variables = local.common_env_vars

  policy_statements = merge(local.s3_datalake_policy, {
    logs = {
      effect    = "Allow"
      actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      resources = ["arn:aws:logs:*:*:*"]
    },
    secrets_manager = {
      effect    = "Allow"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = ["*"]
    }
  })

  tags = {
    Component = "Productivity System"
    Function  = "Todoist Update Integration"
  }
}

# Add some visualization related lambda functions
module "get_visualization_data" {
  source = "./modules/lambda_function"

  function_name    = "get_visualization_data"
  description      = "Lambda function to retrieve visualization data from S3"
  handler          = "getVisualizationData.lambda_handler"
  runtime          = "python3.12"
  timeout          = 10
  zip_file         = local.lambda_zip_path
  create_log_group = false

  environment_variables = merge(local.common_env_vars, {
    VISUALIZATION_BUCKET = module.visualization_data_bucket.s3_bucket_id
  })

  policy_statements = {
    logs = {
      effect    = "Allow"
      actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      resources = ["arn:aws:logs:*:*:*"]
    },
    s3_visualization = {
      effect  = "Allow"
      actions = ["s3:GetObject", "s3:ListBucket"]
      resources = [
        module.visualization_data_bucket.s3_bucket_arn,
        "${module.visualization_data_bucket.s3_bucket_arn}/*"
      ]
    }
  }

  tags = {
    Component = "D3 Dashboard"
    Function  = "Data Retrieval"
  }
}

module "put_visualization_data" {
  source = "./modules/lambda_function"

  function_name    = "put_visualization_data"
  description      = "Lambda function to store visualization data in S3"
  handler          = "putVisualizationData.lambda_handler"
  runtime          = "python3.12"
  timeout          = 10
  zip_file         = local.lambda_zip_path
  create_log_group = false

  environment_variables = merge(local.common_env_vars, {
    VISUALIZATION_BUCKET = module.visualization_data_bucket.s3_bucket_id
  })

  policy_statements = {
    logs = {
      effect    = "Allow"
      actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      resources = ["arn:aws:logs:*:*:*"]
    },
    s3_visualization = {
      effect  = "Allow"
      actions = ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"]
      resources = [
        module.visualization_data_bucket.s3_bucket_arn,
        "${module.visualization_data_bucket.s3_bucket_arn}/*"
      ]
    }
  }

  tags = {
    Component = "D3 Dashboard"
    Function  = "Data Storage"
  }
}
