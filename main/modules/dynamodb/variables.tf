variable "environment" {
  description = "Deployment environment (dev, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Allowed values for environment are \"dev\" or \"prod\"."
  }
  default = "dev"
}

variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "hash_key" {
  description = "The attribute to use as the hash (partition) key"
  type        = string
}

variable "range_key" {
  description = "The attribute to use as the range (sort) key"
  type        = string
  default     = null
}

variable "billing_mode" {
  description = "Controls how you are charged for read and write throughput (PROVISIONED or PAY_PER_REQUEST)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "read_capacity" {
  description = "The number of read units for the table. If the billing_mode is PROVISIONED, this field is required"
  type        = number
  default     = 5
}

variable "write_capacity" {
  description = "The number of write units for the table. If the billing_mode is PROVISIONED, this field is required"
  type        = number
  default     = 5
}

variable "attributes" {
  description = "List of DynamoDB attributes"
  type = list(object({
    name = string
    type = string
  }))
}

variable "global_secondary_indexes" {
  description = "Describe GSIs for the table"
  type = list(object({
    name               = string
    hash_key           = string
    range_key          = string
    write_capacity     = number
    read_capacity      = number
    projection_type    = string
    non_key_attributes = list(string)
  }))
  default = []
}

variable "local_secondary_indexes" {
  description = "Describe LSIs for the table"
  type = list(object({
    name               = string
    range_key          = string
    projection_type    = string
    non_key_attributes = list(string)
  }))
  default = []
}

variable "enable_point_in_time_recovery" {
  description = "Whether to enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "autoscaling_enabled" {
  description = "Whether to enable autoscaling. Only applicable if billing_mode is PROVISIONED"
  type        = bool
  default     = false
}

variable "autoscaling_read_max_capacity" {
  description = "Maximum read capacity for autoscaling"
  type        = number
  default     = 100
}

variable "autoscaling_write_max_capacity" {
  description = "Maximum write capacity for autoscaling"
  type        = number
  default     = 100
}

variable "tags" {
  description = "Map of tags to assign to the table"
  type        = map(string)
  default     = {}
}

variable "ttl_enabled" {
  description = "Whether to enable TTL for the table"
  type        = bool
  default     = false
}

variable "ttl_attribute" {
  description = "The name of the attribute used for TTL"
  type        = string
  default     = null
}
