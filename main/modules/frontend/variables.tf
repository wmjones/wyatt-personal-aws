variable "environment" {
  description = "Deployment environment (dev, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Allowed values for environment are \"dev\" or \"prod\"."
  }
  default = "dev"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for website hosting"
  type        = string
}

variable "domain_name" {
  description = "Optional base domain name for the application (without app prefix). Leave blank to use the auto‑generated CloudFront domain."
  type        = string
  default     = ""
}

variable "app_prefix" {
  description = "Prefix for the application subdomain (default: app)"
  type        = string
  default     = "app"
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
  nullable    = false
}

variable "create_dns_records" {
  description = "Whether to create DNS records for certificate validation and the CloudFront alias (ignored when use_default_cert is true)"
  type        = bool
  default     = false
}

variable "use_default_cert" {
  description = "When true, use CloudFront's default certificate and skip ACM + DNS."
  type        = bool
  default     = true
}

variable "single_page_application" {
  description = "Whether the site is a single-page application that needs special routing"
  type        = bool
  default     = true
}

variable "api_gateway_endpoint" {
  description = "API Gateway endpoint URL for backend integration"
  type        = string
  default     = null
}

variable "enable_api_cache_behavior" {
  description = "Whether to add a cache behavior for API requests"
  type        = bool
  default     = false
}

variable "api_path_pattern" {
  description = "Path pattern for API requests"
  type        = string
  default     = "/api/*"
}

variable "cloudfront_function_code" {
  description = "CloudFront function code for URL rewrites or other manipulations"
  type        = string
  default     = null
}

variable "web_acl_id" {
  description = "ARN of the WAF Web ACL to associate with the CloudFront distribution"
  type        = string
  default     = null
}

variable "kms_key_arn" {
  description = "ARN of KMS key to use for S3 bucket encryption (if null, AES256 will be used)"
  type        = string
  default     = null
}

variable "react_app_build_dir" {
  description = "Path to the React app build directory containing static assets to deploy"
  type        = string
  default     = null
}
