output "parameter_arns" {
  description = "Map of parameter names to their ARNs"
  value = merge(
    { for k, v in aws_ssm_parameter.parameter : k => v.arn },
    { for k, v in aws_ssm_parameter.secure_parameter : k => v.arn }
  )
}

output "parameter_names" {
  description = "Map of parameter names to their full paths"
  value = merge(
    { for k, v in aws_ssm_parameter.parameter : k => v.name },
    { for k, v in aws_ssm_parameter.secure_parameter : k => v.name }
  )
}

output "parameter_versions" {
  description = "Map of parameter names to their versions"
  value = merge(
    { for k, v in aws_ssm_parameter.parameter : k => v.version },
    { for k, v in aws_ssm_parameter.secure_parameter : k => v.version }
  )
}
