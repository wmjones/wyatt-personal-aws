resource "aws_ssm_parameter" "parameter" {
  for_each = var.parameters

  name        = "/${var.project}/${var.environment}/${each.key}"
  description = "Terraform-managed parameter for ${var.project} ${var.environment} environment"
  type        = "String"
  value       = each.value

  tags = merge(
    var.tags,
    {
      Environment = var.environment
      Project     = var.project
      ManagedBy   = "Terraform"
      Purpose     = "Configuration"
    }
  )
}

resource "aws_ssm_parameter" "secure_parameter" {
  # Use provided names or try to extract from secure_parameters
  # If secure_parameter_names is provided, use it; otherwise, attempt using nonsensitive
  for_each = length(var.secure_parameter_names) > 0 ? var.secure_parameter_names : nonsensitive(toset(keys(var.secure_parameters)))

  name        = "/${var.project}/${var.environment}/${each.key}"
  description = "Terraform-managed secure parameter for ${var.project} ${var.environment} environment"
  type        = "SecureString"
  value       = var.secure_parameters[each.key]

  tags = merge(
    var.tags,
    {
      Environment = var.environment
      Project     = var.project
      ManagedBy   = "Terraform"
      Purpose     = "SecureConfiguration"
    }
  )
}
