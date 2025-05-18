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
  # Use keys() to avoid the sensitive value issue
  for_each = toset(keys(var.secure_parameters))

  name        = "/${var.project}/${var.environment}/${each.key}"
  description = "Terraform-managed secure parameter for ${var.project} ${var.environment} environment"
  type        = "SecureString"
  value       = sensitive(var.secure_parameters[each.key])

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
