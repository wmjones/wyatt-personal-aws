variable "environment" {
  description = "Deployment environment (dev, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Allowed values for environment are \"dev\" or \"prod\"."
  }
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Name of the project used for tagging and naming resources"
  type        = string
}

variable "domain_name" {
  description = "Base domain name for the application (without app prefix)"
  type        = string
}

variable "app_prefix" {
  description = "Prefix for the application subdomain (default: app)"
  type        = string
  default     = "app"
}

variable "cognito_domain_prefix" {
  description = "Prefix for Cognito hosted UI domain"
  type        = string
}

# Environment-specific configuration variables

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "single_nat_gateway" {
  description = "Should be true if you want to provision a single shared NAT Gateway across all of your private networks"
  type        = bool
  default     = true
}

variable "vercel_app_url" {
  description = "Vercel deployment URL for the frontend app"
  type        = string
  default     = ""
}

variable "one_nat_gateway_per_az" {
  description = "Should be true if you want only one NAT Gateway per availability zone"
  type        = bool
  default     = false
}

variable "create_interface_endpoints" {
  description = "Whether to create interface endpoints for AWS services (incurs costs)"
  type        = bool
  default     = false
}

variable "cognito_deletion_protection" {
  description = "Whether to enable deletion protection for Cognito user pools"
  type        = bool
  default     = false
}

variable "cognito_identity_pool_enabled" {
  description = "Whether to create a Cognito Identity Pool for the User Pool"
  type        = bool
  default     = true
}

variable "cognito_allow_unauthenticated" {
  description = "Whether to allow unauthenticated access to the Identity Pool"
  type        = bool
  default     = false
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode (PROVISIONED or PAY_PER_REQUEST)"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PROVISIONED", "PAY_PER_REQUEST"], var.dynamodb_billing_mode)
    error_message = "Allowed values for dynamodb_billing_mode are \"PROVISIONED\" or \"PAY_PER_REQUEST\"."
  }
}

variable "dynamodb_point_in_time_recovery" {
  description = "Whether to enable point-in-time recovery for DynamoDB tables"
  type        = bool
  default     = false
}

variable "lambda_runtime" {
  description = "Runtime for Lambda functions"
  type        = string
  default     = "python3.10"
}

variable "websocket_api_name" {
  description = "Name for the WebSocket API"
  type        = string
  default     = "dashboard-websocket"
}

variable "step_function_name" {
  description = "Name for the Step Function state machine"
  type        = string
  default     = "todoist-workflow"
}

variable "lambda_sg_name" {
  description = "Name for the Lambda security group"
  type        = string
  default     = "lambda-security-group"
}

variable "database_sg_name" {
  description = "Name for the database security group"
  type        = string
  default     = "database-security-group"
}

variable "elasticache_sg_name" {
  description = "Name for the ElastiCache security group"
  type        = string
  default     = "elasticache-security-group"
}

variable "alb_sg_name" {
  description = "Name for the ALB security group"
  type        = string
  default     = "alb-security-group"
}

variable "eventbridge_rule_name" {
  description = "Name for the EventBridge rule"
  type        = string
  default     = "todoist-workflow-rule"
}

variable "sns_alert_topic_arn" {
  description = "ARN of SNS topic for CloudWatch alarm notifications (optional)"
  type        = string
  default     = ""
}

variable "ignore_lambda_hash_changes" {
  description = "Ignore Lambda source code hash changes (useful for drift detection)"
  type        = bool
  default     = false
}

variable "override_lambda_hash" {
  description = "Override the computed hash for Python Lambda deployment package"
  type        = string
  default     = ""
}

variable "override_athena_hash" {
  description = "Override the computed hash for Athena Lambda deployment package"
  type        = string
  default     = ""
}

variable "override_forecast_hash" {
  description = "Override the computed hash for Forecast Sync Lambda deployment package"
  type        = string
  default     = ""
}
