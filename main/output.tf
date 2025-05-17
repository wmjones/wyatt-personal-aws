# S3 Bucket Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket for the Todoist data lake"
  value       = aws_s3_bucket.wyatt-datalake-35315550.bucket
}

# Step Function Outputs
output "step_function_arn" {
  description = "ARN of the Todoist workflow Step Function"
  value       = module.todoist_workflow.state_machine_arn
}

# Frontend Outputs
output "website_bucket_name" {
  description = "Name of the S3 bucket hosting the frontend website"
  value       = module.frontend.bucket_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.frontend.cloudfront_distribution_id
}

output "website_url" {
  description = "URL of the frontend website"
  value       = module.frontend.website_url
}

# API Gateway Outputs
output "api_gateway_endpoint" {
  description = "Endpoint URL of the API Gateway"
  value       = module.api_gateway.api_endpoint
}

# Visualization Data Bucket
output "visualization_data_bucket_name" {
  description = "Name of the S3 bucket for visualization data"
  value       = module.visualization_data_bucket.s3_bucket_id
}

# API Gateway Outputs
output "api_endpoint" {
  description = "The API Gateway endpoint URL"
  value       = module.api_gateway.api_endpoint
}

# Cognito Outputs
output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = module.cognito.user_pool_arn
}

output "cognito_client_id" {
  description = "ID of the Cognito User Pool web client"
  value       = module.cognito.client_ids["${var.project_name}-web-client-${var.environment}"]
}

output "cognito_domain" {
  description = "Domain for the Cognito hosted UI"
  value       = module.cognito.domain
}

output "cognito_hosted_ui_url" {
  description = "URL for the Cognito hosted UI login page"
  value       = module.cognito.hosted_ui_url
}

output "cognito_identity_pool_id" {
  description = "ID of the Cognito Identity Pool (if created)"
  value       = var.cognito_identity_pool_enabled ? module.cognito.identity_pool_id : null
}

output "cognito_authenticated_role_arn" {
  description = "ARN of the IAM role for authenticated users"
  value       = var.cognito_identity_pool_enabled ? module.cognito.authenticated_role_arn : null
}

output "cognito_unauthenticated_role_arn" {
  description = "ARN of the IAM role for unauthenticated users"
  value       = var.cognito_identity_pool_enabled ? module.cognito.unauthenticated_role_arn : null
}

# Existing Productivity Lambda Outputs
output "productivity_lambdas" {
  description = "ARNs of the Lambda functions for the productivity workflow"
  value = {
    todoist     = module.todoist_lambda.function_arn
    chatgpt     = module.chatgpt_lambda.function_arn
    notion      = module.notion_lambda.function_arn
    put_todoist = module.put_todoist_lambda.function_arn
  }
}
