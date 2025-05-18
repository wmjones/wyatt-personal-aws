module "api_gateway" {
  source = "./modules/api_gateway"

  api_name        = "dashboard-api"
  api_description = "API for D3 Dashboard visualization data"

  # For production, use static CORS. For dev, use dynamic CORS to handle Vercel previews
  enable_dynamic_cors = var.environment == "dev"
  cors_lambda_arn     = var.environment == "dev" ? module.cors_handler[0].function_invoke_arn : ""

  allowed_origins = var.environment == "prod" ? [
    "https://${var.app_prefix}.${var.domain_name}",
    "http://localhost:3000",
    "http://localhost:3001"
  ] : []

  create_logs          = true
  create_custom_domain = false

  # Configure JWT authorizer for Cognito
  authorizers = {
    cognito_jwt = {
      authorizer_type  = "JWT"
      identity_sources = ["$request.header.Authorization"]
      name             = "cognito-jwt-authorizer"
      audience         = [module.cognito.client_ids["${var.project_name}-web-client-${var.environment}"]]
      issuer           = "https://cognito-idp.${var.aws_region}.amazonaws.com/${module.cognito.user_pool_id}"
    }
  }

  # Integration with Lambda functions for API routes
  integrations = {
    "GET /api/visualizations" = {
      integration_uri        = module.get_visualization_data.function_invoke_arn
      integration_type       = "AWS_PROXY"
      payload_format_version = "2.0"
      timeout_milliseconds   = 10000
      authorization_type     = "JWT"
      authorizer_id          = "cognito_jwt"
    },

    "GET /api/visualizations/{id}" = {
      integration_uri        = module.get_visualization_data.function_invoke_arn
      integration_type       = "AWS_PROXY"
      payload_format_version = "2.0"
      timeout_milliseconds   = 10000
      authorization_type     = "JWT"
      authorizer_id          = "cognito_jwt"
    },

    "POST /api/visualizations" = {
      integration_uri        = module.put_visualization_data.function_invoke_arn
      integration_type       = "AWS_PROXY"
      payload_format_version = "2.0"
      timeout_milliseconds   = 10000
      authorization_type     = "JWT"
      authorizer_id          = "cognito_jwt"
    },

    "PUT /api/visualizations/{id}" = {
      integration_uri        = module.put_visualization_data.function_invoke_arn
      integration_type       = "AWS_PROXY"
      payload_format_version = "2.0"
      timeout_milliseconds   = 10000
      authorization_type     = "JWT"
      authorizer_id          = "cognito_jwt"
    },

    "DELETE /api/visualizations/{id}" = {
      integration_uri        = module.put_visualization_data.function_invoke_arn
      integration_type       = "AWS_PROXY"
      payload_format_version = "2.0"
      timeout_milliseconds   = 10000
      authorization_type     = "JWT"
      authorizer_id          = "cognito_jwt"
    }
  }

  tags = {
    Component = "D3 Dashboard"
    Name      = "Visualization API"
  }
}

# Create Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_get" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = module.get_visualization_data.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.api_arn}/*"
}

resource "aws_lambda_permission" "api_gateway_put" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = module.put_visualization_data.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.api_arn}/*"
}
