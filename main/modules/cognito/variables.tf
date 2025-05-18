variable "environment" {
  description = "Deployment environment (dev, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Allowed values for environment are \"dev\" or \"prod\"."
  }
  default = "dev"
}

variable "user_pool_name" {
  description = "Name of the Cognito User Pool"
  type        = string
}

variable "domain_prefix" {
  description = "Domain prefix for the Cognito User Pool"
  type        = string
}

variable "clients" {
  description = "List of app clients for the Cognito User Pool"
  type = list(object({
    name                                 = string
    generate_secret                      = bool
    callback_urls                        = list(string)
    logout_urls                          = list(string)
    allowed_oauth_flows                  = list(string)
    allowed_oauth_scopes                 = list(string)
    allowed_oauth_flows_user_pool_client = bool
    supported_identity_providers         = list(string)
  }))
  default = []
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection"
  type        = bool
  default     = false
}

variable "mfa_enabled" {
  description = "Whether to enable Multi-Factor Authentication as OPTIONAL"
  type        = bool
  default     = false
}

variable "lambda_triggers" {
  description = "Map of Lambda triggers for User Pool customization"
  type        = map(string)
  default     = null
}

# Identity Pool configuration variables
variable "create_identity_pool" {
  description = "Whether to create an identity pool for the Cognito User Pool"
  type        = bool
  default     = true
}

variable "main_client_name" {
  description = "Name of the main client to use for the identity pool"
  type        = string
  default     = null
}

variable "allow_unauthenticated_identities" {
  description = "Whether to allow unauthenticated identities in the identity pool"
  type        = bool
  default     = false
}

variable "authenticated_role_arn" {
  description = "ARN of the IAM role for authenticated users (if not provided, one will be created)"
  type        = string
  default     = null
}

variable "unauthenticated_role_arn" {
  description = "ARN of the IAM role for unauthenticated users (if not provided, one will be created)"
  type        = string
  default     = null
}

variable "api_gateway_arns" {
  description = "List of API Gateway ARNs that authenticated users can access (use ['*'] for all resources)"
  type        = list(string)
  default     = ["*"]
}

variable "public_api_gateway_arns" {
  description = "List of API Gateway ARNs that unauthenticated users can access (must be specific ARNs, not wildcard)"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to the Cognito User Pool"
  type        = map(string)
  default     = {}
}

variable "schema_attributes" {
  description = "List of schema attributes for Cognito User Pool (NOTE: Changes to these after initial creation will be ignored due to the lifecycle block)"
  type = list(object({
    name                     = string
    attribute_data_type      = string
    developer_only_attribute = optional(bool, false)
    mutable                  = optional(bool, true)
    required                 = optional(bool, false)
    min_length               = optional(number, 0)
    max_length               = optional(number, 2048)
    min_value                = optional(string)
    max_value                = optional(string)
  }))
  default = [
    {
      name                = "name"
      attribute_data_type = "String"
      mutable             = true
      required            = true
      min_length          = 3
      max_length          = 100
    },
    {
      name                = "preferred_username"
      attribute_data_type = "String"
      mutable             = true
      required            = false
      min_length          = 3
      max_length          = 20
    },
    {
      name                = "email"
      attribute_data_type = "String"
      mutable             = true
      required            = true
      min_length          = 5
      max_length          = 255
    },
    {
      name                = "custom:preferences"
      attribute_data_type = "String"
      mutable             = true
      required            = false
      min_length          = 0
      max_length          = 2048
    }
  ]
}

variable "prevent_schema_changes" {
  description = "Flag for whether schema changes should be prevented (DEPRECATED: schema changes are now always ignored via lifecycle block)"
  type        = bool
  default     = false
}
