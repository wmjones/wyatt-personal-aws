# Lambda functions for the Normal Distribution Visualization Dashboard

locals {
  # Shorten the names to avoid IAM role name length limitations (64 chars max)
  function_prefix = "viz"
  env_suffix      = var.environment

  # Use the same deployment package as other lambda functions
  lambda_viz_zip_path = local.lambda_zip_path
}

# Get visualization data Lambda
module "get_visualization_lambda" {
  source = "./modules/lambda_function"

  function_name = "${local.function_prefix}-get-${local.env_suffix}"
  description   = "Lambda function to get normal distribution parameters"
  handler       = "visualization/getVisualizationData.lambda_handler"
  runtime       = "python3.12"
  timeout       = 10
  zip_file      = local.lambda_viz_zip_path

  environment_variables = {
    PARAMETER_TABLE = module.parameter_table.table_id
  }

  policy_statements = {
    dynamodb = {
      effect  = "Allow"
      actions = ["dynamodb:Query", "dynamodb:Scan", "dynamodb:GetItem"]
      resources = [
        module.parameter_table.table_arn
      ]
    },
    logs = {
      effect    = "Allow"
      actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      resources = ["arn:aws:logs:*:*:*"]
    }
  }

  tags = {
    Component   = "D3 Dashboard"
    Function    = "Get Visualization Data"
    Environment = var.environment
  }
}

# Update visualization data Lambda
module "update_visualization_lambda" {
  source = "./modules/lambda_function"

  function_name = "${local.function_prefix}-update-${local.env_suffix}"
  description   = "Lambda function to update normal distribution parameters"
  handler       = "visualization/updateVisualizationParams.lambda_handler"
  runtime       = "python3.12"
  timeout       = 10
  zip_file      = local.lambda_viz_zip_path

  environment_variables = {
    PARAMETER_TABLE        = module.parameter_table.table_id
    HISTORY_TABLE          = module.history_table.table_id
    CONNECTION_TABLE       = module.connection_table.table_id
    WEBSOCKET_API_ENDPOINT = aws_apigatewayv2_stage.websocket.invoke_url
  }

  policy_statements = {
    dynamodb = {
      effect  = "Allow"
      actions = ["dynamodb:Query", "dynamodb:Scan", "dynamodb:GetItem", "dynamodb:PutItem"]
      resources = [
        module.parameter_table.table_arn,
        module.history_table.table_arn,
        module.connection_table.table_arn
      ]
    },
    websocket = {
      effect    = "Allow"
      actions   = ["execute-api:ManageConnections"]
      resources = ["${aws_apigatewayv2_api.websocket.execution_arn}/*"]
    },
    logs = {
      effect    = "Allow"
      actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      resources = ["arn:aws:logs:*:*:*"]
    }
  }

  tags = {
    Component   = "D3 Dashboard"
    Function    = "Update Visualization Data"
    Environment = var.environment
  }
}

# WebSocket Connect Lambda
module "ws_connect_lambda" {
  source = "./modules/lambda_function"

  function_name = "${local.function_prefix}-ws-connect-${local.env_suffix}"
  description   = "Lambda function to handle WebSocket connections"
  handler       = "visualization/wsConnect.lambda_handler"
  runtime       = "python3.12"
  timeout       = 10
  zip_file      = local.lambda_viz_zip_path

  environment_variables = {
    CONNECTION_TABLE = module.connection_table.table_id
  }

  policy_statements = {
    dynamodb = {
      effect  = "Allow"
      actions = ["dynamodb:PutItem"]
      resources = [
        module.connection_table.table_arn
      ]
    },
    logs = {
      effect    = "Allow"
      actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      resources = ["arn:aws:logs:*:*:*"]
    }
  }

  tags = {
    Component   = "D3 Dashboard"
    Function    = "WebSocket Connect"
    Environment = var.environment
  }
}

# WebSocket Disconnect Lambda
module "ws_disconnect_lambda" {
  source = "./modules/lambda_function"

  function_name = "${local.function_prefix}-ws-disconnect-${local.env_suffix}"
  description   = "Lambda function to handle WebSocket disconnections"
  handler       = "visualization/wsDisconnect.lambda_handler"
  runtime       = "python3.12"
  timeout       = 10
  zip_file      = local.lambda_viz_zip_path

  environment_variables = {
    CONNECTION_TABLE = module.connection_table.table_id
  }

  policy_statements = {
    dynamodb = {
      effect  = "Allow"
      actions = ["dynamodb:DeleteItem"]
      resources = [
        module.connection_table.table_arn
      ]
    },
    logs = {
      effect    = "Allow"
      actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      resources = ["arn:aws:logs:*:*:*"]
    }
  }

  tags = {
    Component   = "D3 Dashboard"
    Function    = "WebSocket Disconnect"
    Environment = var.environment
  }
}
