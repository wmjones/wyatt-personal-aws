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

variable "secure_parameter_names" {
  description = "List of secure parameter names for for_each iteration"
  type        = set(string)
  default     = []
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}
