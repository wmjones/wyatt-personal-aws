output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "Endpoint of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.endpoint
}

output "client_ids" {
  description = "Map of client IDs"
  value       = { for k, v in aws_cognito_user_pool_client.clients : k => v.id }
}

output "client_secrets" {
  description = "Map of client secrets"
  value       = { for k, v in aws_cognito_user_pool_client.clients : k => v.client_secret if v.generate_secret }
  sensitive   = true
}

output "domain" {
  description = "Cognito User Pool domain"
  value       = "${var.domain_prefix}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

output "hosted_ui_url" {
  description = "Hosted UI URL for the Cognito User Pool"
  value       = "${var.domain_prefix}.auth.${data.aws_region.current.name}.amazoncognito.com/login?client_id=${local.client_id}&response_type=code&redirect_uri=${local.callback_url}"
}

# Identity Pool outputs
output "identity_pool_id" {
  description = "ID of the Cognito Identity Pool"
  value       = var.create_identity_pool ? aws_cognito_identity_pool.main[0].id : null
}

output "identity_pool_arn" {
  description = "ARN of the Cognito Identity Pool"
  value       = var.create_identity_pool ? "arn:aws:cognito-identity:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:identitypool/${aws_cognito_identity_pool.main[0].id}" : null
}

output "authenticated_role_arn" {
  description = "ARN of the authenticated IAM role"
  value       = var.create_identity_pool ? (var.authenticated_role_arn != null ? var.authenticated_role_arn : aws_iam_role.authenticated_role[0].arn) : null
}

output "unauthenticated_role_arn" {
  description = "ARN of the unauthenticated IAM role"
  value       = var.create_identity_pool ? (var.unauthenticated_role_arn != null ? var.unauthenticated_role_arn : aws_iam_role.unauthenticated_role[0].arn) : null
}

# Get current AWS region for the domain output
data "aws_region" "current" {}

# Get current AWS account ID for ARN construction
data "aws_caller_identity" "current" {}
