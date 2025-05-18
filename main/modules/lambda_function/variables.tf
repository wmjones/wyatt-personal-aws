variable "environment" {
  description = "Deployment environment (dev, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Allowed values for environment are \"dev\" or \"prod\"."
  }
  default = "dev"
}

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "description" {
  description = "Description of the Lambda function"
  type        = string
  default     = ""
}

variable "handler" {
  description = "Lambda function handler"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.12"
}

variable "zip_file" {
  description = "Path to the zip file containing the Lambda code"
  type        = string
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 10
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 128
}

variable "environment_variables" {
  description = "Environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}

variable "policy_statements" {
  description = "IAM policy statements for the Lambda function"
  type = map(object({
    effect    = string
    actions   = list(string)
    resources = list(string)
  }))
  default = {}
}

variable "tags" {
  description = "Tags to apply to the Lambda function"
  type        = map(string)
  default     = {}
}

variable "create_log_group" {
  description = "Whether to create a new CloudWatch Logs log group (set to false if log group already exists)"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "Retention period in days for CloudWatch Logs log group (if created)"
  type        = number
  default     = 14
}

variable "vpc_subnet_ids" {
  description = "List of subnet IDs to deploy Lambda in VPC (must provide vpc_security_group_ids if specified)"
  type        = list(string)
  default     = null
}

variable "vpc_security_group_ids" {
  description = "List of security group IDs to attach to running Lambda in VPC"
  type        = list(string)
  default     = null
}

variable "publish" {
  description = "Whether to publish Lambda function as a new version"
  type        = bool
  default     = false
}

variable "layers" {
  description = "List of Lambda Layer ARNs to attach to the function"
  type        = list(string)
  default     = []
}

variable "tracing_mode" {
  description = "X-Ray tracing mode (PassThrough or Active)"
  type        = string
  default     = null
}

variable "dead_letter_target_arn" {
  description = "ARN of SQS queue or SNS topic for the dead letter target"
  type        = string
  default     = null
}
