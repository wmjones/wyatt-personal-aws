terraform {
  cloud {
    organization = "wyatt-personal-aws"
    workspaces {
      tags = ["wyatt-personal-aws"]
    }
  }
}
