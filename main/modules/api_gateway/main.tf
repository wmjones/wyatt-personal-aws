locals {
  # Validate that when create_custom_domain is true, both domain_name and certificate_arn are provided
  validate_custom_domain = var.create_custom_domain && (var.domain_name == "" || var.certificate_arn == "") ? tobool("When create_custom_domain is true, both domain_name and certificate_arn must be provided.") : true
}

resource "aws_apigatewayv2_api" "this" {
  name          = var.api_name
  description   = var.api_description
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.allowed_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
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

resource "aws_apigatewayv2_route" "this" {
  for_each = var.integrations

  api_id             = aws_apigatewayv2_api.this.id
  route_key          = each.key
  target             = "integrations/${aws_apigatewayv2_integration.this[each.key].id}"
  authorization_type = try(each.value.authorization_type, "NONE")
  authorizer_id      = try(each.value.authorizer_id, null)
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
