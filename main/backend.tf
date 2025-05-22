terraform {
  cloud {
    organization = "wyatt-personal-aws"

    # Workspace configuration using name strategy
    # This allows explicit workspace selection via TF_WORKSPACE environment variable
    # No workspaces block needed - workspace is selected dynamically via TF_WORKSPACE

    # The actual workspace is selected by:
    # 1. TF_WORKSPACE environment variable (set by GitHub Actions)
    # 2. terraform workspace select command (for local development)
    #
    # Valid workspaces:
    # - wyatt-personal-aws-dev
    # - wyatt-personal-aws-prod
  }
}
