module "cognito" {
  source = "./modules/cognito"

  environment            = var.environment
  user_pool_name         = "${var.project_name}-user-pool-${var.environment}"
  domain_prefix          = var.cognito_domain_prefix
  deletion_protection    = var.cognito_deletion_protection
  mfa_enabled            = var.environment == "prod" ? true : false
  prevent_schema_changes = true # Enable this to prevent schema modification errors on updates

  # Define app client for web application
  clients = [
    {
      name                                 = "${var.project_name}-web-client-${var.environment}"
      generate_secret                      = false
      callback_urls                        = ["https://${var.app_prefix}.${var.domain_name}/callback", "http://localhost:3000/callback"]
      logout_urls                          = ["https://${var.app_prefix}.${var.domain_name}", "http://localhost:3000"]
      allowed_oauth_flows                  = ["implicit", "code"]
      allowed_oauth_scopes                 = ["openid", "email", "profile"]
      allowed_oauth_flows_user_pool_client = true
      supported_identity_providers         = ["COGNITO"]
    }
  ]

  # Identity Pool Configuration
  create_identity_pool             = var.cognito_identity_pool_enabled
  main_client_name                 = "${var.project_name}-web-client-${var.environment}"
  allow_unauthenticated_identities = var.cognito_allow_unauthenticated

  # API Gateway ARNs that authenticated users can access
  # Placeholder - will be replaced with actual ARN when API Gateway is created
  api_gateway_arns = ["*"]

  # No public API endpoints for unauthenticated users by default
  public_api_gateway_arns = []

  # Lambda triggers for custom functionality
  # Uncomment and specify ARNs when Lambda functions are created
  # lambda_triggers = {
  #   pre_sign_up = module.pre_signup_lambda.lambda_function_arn
  # }

  tags = {
    Component   = "Authentication"
    Name        = "User Pool"
    Environment = var.environment
    Project     = var.project_name
  }
}
