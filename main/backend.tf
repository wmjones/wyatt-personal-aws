terraform {
  cloud {
    organization = "wyatt-personal-aws"

    # Workspace configuration
    # The actual workspace is selected by:
    # 1. TF_WORKSPACE environment variable (set by GitHub Actions)
    # 2. terraform workspace select command (for local development)
    #
    # Valid workspaces:
    # - wyatt-personal-aws-dev
    # - wyatt-personal-aws-prod
    #
    # NOTE: No workspaces block is needed here because workspace selection
    # is handled via the TF_WORKSPACE environment variable, which is set
    # by the CI/CD pipeline and can be set locally for development.
  }
}
