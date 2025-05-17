output "api_id" {
  description = "The API Gateway ID"
  value       = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  description = "The API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "api_arn" {
  description = "The API Gateway ARN"
  value       = aws_apigatewayv2_api.this.arn
}

output "stage_id" {
  description = "The default stage ID"
  value       = aws_apigatewayv2_stage.this.id
}

output "custom_domain_url" {
  description = "Custom domain URL for the API Gateway"
  value       = var.create_custom_domain ? "https://${var.domain_name}" : null
}

output "execution_arn" {
  description = "The execution ARN of the API Gateway (used for Lambda permissions)"
  value       = aws_apigatewayv2_api.this.execution_arn
}

output "authorizer_ids" {
  description = "Map of authorizer names to their IDs"
  value       = { for k, v in aws_apigatewayv2_authorizer.this : k => v.id }
}
