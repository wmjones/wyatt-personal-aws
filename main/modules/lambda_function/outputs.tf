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
