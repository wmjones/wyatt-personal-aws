variable "name" {
  description = "Name of the Step Function"
  type        = string
}

variable "type" {
  description = "Type of the Step Function (STANDARD or EXPRESS)"
  type        = string
  default     = "STANDARD"
}

variable "role_arn" {
  description = "ARN of the IAM role for the Step Function"
  type        = string
}

variable "definition" {
  description = "State machine definition as a JSON string"
  type        = string
}

variable "tags" {
  description = "Tags to apply to the Step Function"
  type        = map(string)
  default     = {}
}
