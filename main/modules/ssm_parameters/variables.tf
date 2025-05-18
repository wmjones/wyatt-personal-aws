variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "parameters" {
  description = "Map of parameter names and values to store in SSM"
  type        = map(string)
}

variable "secure_parameters" {
  description = "Map of secure parameter names and values to store in SSM"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}
