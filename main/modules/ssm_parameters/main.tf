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
  for_each = var.secure_parameters

  name        = "/${var.project}/${var.environment}/${each.key}"
  description = "Terraform-managed secure parameter for ${var.project} ${var.environment} environment"
  type        = "SecureString"
  value       = each.value

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
