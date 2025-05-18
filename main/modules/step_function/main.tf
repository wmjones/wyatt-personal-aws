module "step_function" {
  source  = "terraform-aws-modules/step-functions/aws"
  version = "~> 2.0"

  name     = var.name
  type     = var.type
  role_arn = var.role_arn

  definition = var.definition

  logging_configuration = {
    include_execution_data = true
    level                  = "ERROR"
  }

  service_integrations = {
    lambda = {
      lambda = ["arn:aws:lambda:*:*:function:*"]
    }
  }

  tags = var.tags
}
