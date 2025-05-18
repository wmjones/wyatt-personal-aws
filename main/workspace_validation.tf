# Workspace validation to ensure correct workspace is being used
# This prevents accidental deployments to the wrong environment

locals {
  # Define valid workspace names
  valid_workspaces = [
    "wyatt-personal-aws-dev",
    "wyatt-personal-aws-prod"
  ]

  # Get current workspace
  current_workspace = terraform.workspace

  # Validate workspace
  workspace_valid = contains(local.valid_workspaces, local.current_workspace)

  # Map workspace to environment
  workspace_environment_map = {
    "wyatt-personal-aws-dev"  = "dev"
    "wyatt-personal-aws-prod" = "prod"
    "default"                 = "dev" # Fallback for local development
  }

  # Get environment from workspace
  derived_environment = lookup(local.workspace_environment_map, local.current_workspace, "unknown")
}

# Validate that we're using a valid workspace
resource "terraform_data" "workspace_validation" {
  lifecycle {
    precondition {
      condition = local.workspace_valid || local.current_workspace == "default"
      error_message = join(" ", [
        "Invalid workspace: ${local.current_workspace}.",
        "Valid workspaces are: ${join(", ", local.valid_workspaces)}.",
        "Use 'terraform workspace select <workspace>' or set TF_WORKSPACE environment variable."
      ])
    }
  }

  input = {
    workspace   = local.current_workspace
    environment = local.derived_environment
  }
}

# Validate that workspace matches the environment variable
resource "terraform_data" "environment_consistency_check" {
  lifecycle {
    precondition {
      condition = local.derived_environment == var.environment || local.current_workspace == "default"
      error_message = join(" ", [
        "Workspace/environment mismatch!",
        "Workspace '${local.current_workspace}' implies environment '${local.derived_environment}'",
        "but var.environment is set to '${var.environment}'.",
        "Please ensure consistency between workspace and environment variables."
      ])
    }
  }

  input = {
    workspace_environment = local.derived_environment
    var_environment       = var.environment
  }
}

# Additional safeguard for production deployments
resource "terraform_data" "production_deployment_guard" {
  count = local.current_workspace == "wyatt-personal-aws-prod" ? 1 : 0

  lifecycle {
    precondition {
      condition     = var.environment == "prod"
      error_message = "Production workspace requires environment variable to be set to 'prod' for safety."
    }
  }

  input = {
    production_deployment = true
    timestamp             = timestamp()
  }
}

# Output workspace information for debugging
output "workspace_info" {
  description = "Current workspace information"
  value = {
    current_workspace      = local.current_workspace
    is_valid_workspace     = local.workspace_valid
    derived_environment    = local.derived_environment
    configured_environment = var.environment
  }
}
