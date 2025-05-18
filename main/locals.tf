# Workspace-specific configuration and derived values
locals {
  # Map workspace names to environments
  workspace_to_env = {
    "wyatt-personal-aws-dev"  = "dev"
    "wyatt-personal-aws-prod" = "prod"
    "default"                 = "dev" # For local development
  }

  # Derive environment from current workspace
  workspace_environment = lookup(local.workspace_to_env, terraform.workspace, "dev")

  # Workspace-specific tagging
  workspace_tags = {
    Workspace   = terraform.workspace
    Environment = local.workspace_environment
    ManagedBy   = "Terraform Cloud"
  }

  # Common tags that apply to all resources
  common_tags = merge(
    local.workspace_tags,
    {
      Project     = var.project_name
      Environment = var.environment
      CreatedDate = formatdate("YYYY-MM-DD", timestamp())
      ManagedBy   = "Terraform"
    }
  )

  # Workspace-specific naming conventions
  resource_prefix = "${var.project_name}-${var.environment}"

  # Workspace-specific feature flags
  is_production  = var.environment == "prod" || terraform.workspace == "wyatt-personal-aws-prod"
  is_development = var.environment == "dev" || terraform.workspace == "wyatt-personal-aws-dev"

  # Cost optimization settings based on workspace
  enable_cost_optimization = local.is_development
  enable_high_availability = local.is_production

  # Monitoring and alerting thresholds
  alarm_evaluation_periods   = local.is_production ? 2 : 5
  alarm_threshold_multiplier = local.is_production ? 1.0 : 1.5

  # Backup and retention policies
  backup_retention_days = local.is_production ? 30 : 7
  log_retention_days    = local.is_production ? 90 : 30

  # Security settings
  enable_detailed_monitoring = local.is_production
  enable_encryption_at_rest  = true # Always enable encryption
  deletion_protection        = local.is_production
}

# Outputs for debugging workspace configuration
output "workspace_configuration" {
  description = "Current workspace configuration"
  value = {
    current_workspace   = terraform.workspace
    derived_environment = local.workspace_environment
    is_production       = local.is_production
    is_development      = local.is_development
    resource_prefix     = local.resource_prefix
  }
}
