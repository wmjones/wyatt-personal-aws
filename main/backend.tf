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
    # NOTE: While we use tag-based selection here for flexibility,
    # the CI/CD pipeline explicitly sets the workspace name

    workspaces {
      tags = ["wyatt-personal-aws"]
    }
  }
}
