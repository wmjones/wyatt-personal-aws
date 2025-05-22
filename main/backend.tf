terraform {
  cloud {
    organization = "wyatt-personal-aws"

    # Workspace configuration using tags strategy
    # This allows multiple workspaces to be managed under the same configuration
    workspaces {
      tags = ["wyatt-personal-aws"]
    }

    # The actual workspace is selected by:
    # 1. TF_WORKSPACE environment variable (set by GitHub Actions)
    # 2. terraform workspace select command (for local development)
    #
    # Valid workspaces:
    # - wyatt-personal-aws-dev (tagged with "wyatt-personal-aws")
    # - wyatt-personal-aws-prod (tagged with "wyatt-personal-aws")
  }
}
