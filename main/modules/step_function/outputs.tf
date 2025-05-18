output "state_machine_id" {
  description = "The ID of the Step Function"
  value       = module.step_function.state_machine_id
}

output "state_machine_arn" {
  description = "The ARN of the Step Function"
  value       = module.step_function.state_machine_arn
}

output "state_machine_name" {
  description = "The name of the Step Function"
  value       = var.name
}

output "state_machine_role_arn" {
  description = "The ARN of the IAM role used by the Step Function"
  value       = module.step_function.role_arn
}

output "state_machine_role_name" {
  description = "The name of the IAM role used by the Step Function"
  value       = module.step_function.role_name
}
