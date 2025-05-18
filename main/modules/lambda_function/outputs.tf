output "function_arn" {
  description = "The ARN of the Lambda function"
  value       = module.lambda_function.lambda_function_arn
}

output "function_name" {
  description = "The name of the Lambda function"
  value       = module.lambda_function.lambda_function_name
}

output "function_invoke_arn" {
  description = "The invoke ARN of the Lambda function"
  value       = module.lambda_function.lambda_function_invoke_arn
}

# Keep backward compatibility
output "invoke_arn" {
  description = "The invoke ARN of the Lambda function (deprecated, use function_invoke_arn instead)"
  value       = module.lambda_function.lambda_function_invoke_arn
}

output "role_arn" {
  description = "The ARN of the IAM role created for the Lambda function"
  value       = module.lambda_function.lambda_role_arn
}

output "role_name" {
  description = "The name of the IAM role created for the Lambda function"
  value       = module.lambda_function.lambda_role_name
}

output "log_group_name" {
  description = "The name of the CloudWatch Logs log group for the Lambda function"
  value       = var.create_log_group ? aws_cloudwatch_log_group.lambda[0].name : "/aws/lambda/${var.function_name}"
}

output "function_version" {
  description = "Latest published version of the Lambda function"
  value       = module.lambda_function.lambda_function_version
}

output "function_qualified_arn" {
  description = "The ARN identifying the Lambda function version"
  value       = module.lambda_function.lambda_function_qualified_arn
}

output "function_url" {
  description = "Lambda function URL (if enabled)"
  value       = try(module.lambda_function.lambda_function_url, null)
}

output "function_source_code_hash" {
  description = "Source code hash of the Lambda function"
  value       = module.lambda_function.lambda_function_source_code_hash
}
