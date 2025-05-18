# Replace the validation logic with an assert block
resource "terraform_data" "validate_custom_domain" {
  count = var.create_custom_domain ? 1 : 0

  lifecycle {
    precondition {
      condition     = var.domain_name != "" && var.certificate_arn != ""
      error_message = "When create_custom_domain is true, both domain_name and certificate_arn must be provided."
    }
  }
}

resource "aws_apigatewayv2_api" "this" {
  name          = var.api_name
  description   = var.api_description
  protocol_type = "HTTP"

  # Only configure built-in CORS if not using dynamic CORS
  dynamic "cors_configuration" {
    for_each = var.enable_dynamic_cors ? [] : [1]
    content {
      allow_origins = var.allowed_origins
      allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
      allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    }
  }

  tags = var.tags
}

resource "aws_apigatewayv2_stage" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  dynamic "access_log_settings" {
    for_each = var.create_logs ? [1] : []

    content {
      destination_arn = aws_cloudwatch_log_group.api_gw[0].arn
      format = jsonencode({
        requestId        = "$context.requestId"
        ip               = "$context.identity.sourceIp"
        requestTime      = "$context.requestTime"
        httpMethod       = "$context.httpMethod"
        routeKey         = "$context.routeKey"
        status           = "$context.status"
        protocol         = "$context.protocol"
        responseLength   = "$context.responseLength"
        integrationError = "$context.integrationErrorMessage"
      })
    }
  }

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "api_gw" {
  count = var.create_logs ? 1 : 0

  name              = "/aws/apigateway/${var.api_name}"
  retention_in_days = 7

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "this" {
  for_each = var.integrations

  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = try(each.value.integration_type, "AWS_PROXY")
  integration_uri        = lookup(each.value, "integration_uri", lookup(each.value, "arn", null))
  integration_method     = try(each.value.integration_method, "POST")
  payload_format_version = try(each.value.payload_format_version, "2.0")
}

# Dynamic CORS OPTIONS integration
resource "aws_apigatewayv2_integration" "cors_options" {
  count = var.enable_dynamic_cors ? 1 : 0

  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.cors_lambda_arn
  integration_method     = "POST"
  payload_format_version = "1.0" # Use 1.0 for custom CORS handling
}

resource "aws_apigatewayv2_route" "this" {
  for_each = var.integrations

  api_id             = aws_apigatewayv2_api.this.id
  route_key          = each.key
  target             = "integrations/${aws_apigatewayv2_integration.this[each.key].id}"
  authorization_type = try(each.value.authorization_type, "NONE")
  authorizer_id      = try(each.value.authorizer_id, null) != null ? aws_apigatewayv2_authorizer.this[each.value.authorizer_id].id : null
}

# Dynamic CORS OPTIONS routes
resource "aws_apigatewayv2_route" "cors_options" {
  for_each = var.enable_dynamic_cors ? toset([
    for key in keys(var.integrations) :
    replace(key, "/^(GET|POST|PUT|DELETE|PATCH) /", "OPTIONS ")
    if can(regex("^(GET|POST|PUT|DELETE|PATCH) ", key))
  ]) : []

  api_id             = aws_apigatewayv2_api.this.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.cors_options[0].id}"
  authorization_type = "NONE" # OPTIONS requests should not require authorization

  depends_on = [
    aws_apigatewayv2_route.this
  ]
}

resource "aws_apigatewayv2_authorizer" "this" {
  for_each = var.authorizers

  api_id           = aws_apigatewayv2_api.this.id
  authorizer_type  = try(each.value.authorizer_type, "JWT")
  identity_sources = try(each.value.identity_sources, ["$request.header.Authorization"])
  name             = try(each.value.name, each.key)
  # Only set payload format version for REQUEST (Lambda) authorizers
  authorizer_payload_format_version = each.value.authorizer_type == "REQUEST" ? try(each.value.payload_format_version, "2.0") : null

  dynamic "jwt_configuration" {
    for_each = each.value.authorizer_type == "JWT" ? [1] : []

    content {
      audience = try(each.value.audience, null)
      issuer   = try(each.value.issuer, null)
    }
  }
}

resource "aws_apigatewayv2_domain_name" "this" {
  count = var.create_custom_domain ? 1 : 0

  domain_name = var.domain_name

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = var.tags
}

resource "aws_apigatewayv2_api_mapping" "this" {
  count = var.create_custom_domain ? 1 : 0

  api_id      = aws_apigatewayv2_api.this.id
  domain_name = aws_apigatewayv2_domain_name.this[0].domain_name
  stage       = aws_apigatewayv2_stage.this.id
}
