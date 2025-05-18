variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
}

variable "api_description" {
  description = "Description of the API Gateway"
  type        = string
  default     = "API Gateway for the application"
}

variable "allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "create_custom_domain" {
  description = "Set to true to provision an API Gateway custom domain. Requires domain_name and certificate_arn."
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Fully‑qualified custom domain name for the API (e.g., api.example.com). Leave blank when create_custom_domain is false."
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN to use with the custom domain."
  type        = string
  default     = ""
}

variable "create_logs" {
  description = "Whether to create CloudWatch logs for the API Gateway"
  type        = bool
  default     = true
}

variable "integrations" {
  description = "Map of API Gateway route integrations"
  type        = any
  default     = {}
}

variable "tags" {
  description = "Tags to apply to API Gateway resources"
  type        = map(string)
  default     = {}
}

variable "authorizers" {
  description = "Map of API Gateway authorizers"
  type        = map(any)
  default     = {}
}
