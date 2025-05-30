module "lambda_function" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 4.0"

  function_name = var.function_name
  description   = var.description
  handler       = var.handler
  runtime       = var.runtime

  create_package         = false
  local_existing_package = var.zip_file

  timeout     = var.timeout
  memory_size = var.memory_size

  environment_variables = var.environment_variables

  # VPC configuration
  vpc_subnet_ids         = var.vpc_subnet_ids
  vpc_security_group_ids = var.vpc_security_group_ids

  # Additional enhancements
  publish                = var.publish
  layers                 = var.layers
  tracing_mode           = var.tracing_mode
  dead_letter_target_arn = var.dead_letter_target_arn

  # IAM policy statements
  attach_policy_statements = true
  policy_statements        = var.policy_statements

  # Add VPC policy statements if Lambda is deployed in VPC
  attach_network_policy = var.vpc_subnet_ids != null ? true : false

  tags = merge(var.tags, {
    Environment = var.environment
  })
}
