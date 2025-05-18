resource "aws_cognito_user_pool" "main" {
  # Add lifecycle block to ignore schema changes after initial creation
  # Schema changes are always ignored if prevent_schema_changes is true (managed via config)
  lifecycle {
    ignore_changes = [schema]
  }
  name = var.user_pool_name

  # Username and email configuration
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Account recovery settings
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Admin account creation settings
  admin_create_user_config {
    allow_admin_create_user_only = false
    invite_message_template {
      email_message = "Your username is {username} and temporary password is {####}. Please login and change your password."
      email_subject = "Your temporary password for ${var.user_pool_name}"
      sms_message   = "Your username is {username} and temporary password is {####}."
    }
  }

  # Password policy settings
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  # MFA configuration - optional for better security
  mfa_configuration = var.mfa_enabled ? "OPTIONAL" : "OFF"

  # Enable if MFA is enabled
  dynamic "software_token_mfa_configuration" {
    for_each = var.mfa_enabled ? [1] : []
    content {
      enabled = true
    }
  }

  # Verification message customization
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = "Your verification code is {####}. Please use this to verify your email address."
    email_subject        = "Your email verification code"
    sms_message          = "Your verification code is {####}."
  }

  # Email provider configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # User pool deletion protection
  deletion_protection = var.deletion_protection ? "ACTIVE" : "INACTIVE"

  # Use schema_attributes variable to define schemas or disable schema attributes with lifecycle ignore_changes
  # This approach prevents "cannot modify or remove schema items" errors after creation

  # Schema changes are handled by the lifecycle ignore_changes directive
  # Only apply schema if schema_attributes are provided, otherwise use AWS defaults
  dynamic "schema" {
    for_each = var.schema_attributes
    content {
      name                     = schema.value.name
      attribute_data_type      = schema.value.attribute_data_type
      developer_only_attribute = lookup(schema.value, "developer_only_attribute", false)
      mutable                  = lookup(schema.value, "mutable", true)
      required                 = lookup(schema.value, "required", false)

      dynamic "string_attribute_constraints" {
        for_each = schema.value.attribute_data_type == "String" ? [1] : []
        content {
          min_length = lookup(schema.value, "min_length", 0)
          max_length = lookup(schema.value, "max_length", 2048)
        }
      }

      dynamic "number_attribute_constraints" {
        for_each = schema.value.attribute_data_type == "Number" ? [1] : []
        content {
          min_value = lookup(schema.value, "min_value", null)
          max_value = lookup(schema.value, "max_value", null)
        }
      }
    }
  }

  # Lambda triggers for custom functionality (if defined)
  dynamic "lambda_config" {
    for_each = var.lambda_triggers != null ? [1] : []
    content {
      create_auth_challenge          = lookup(var.lambda_triggers, "create_auth_challenge", null)
      custom_message                 = lookup(var.lambda_triggers, "custom_message", null)
      define_auth_challenge          = lookup(var.lambda_triggers, "define_auth_challenge", null)
      post_authentication            = lookup(var.lambda_triggers, "post_authentication", null)
      post_confirmation              = lookup(var.lambda_triggers, "post_confirmation", null)
      pre_authentication             = lookup(var.lambda_triggers, "pre_authentication", null)
      pre_sign_up                    = lookup(var.lambda_triggers, "pre_sign_up", null)
      pre_token_generation           = lookup(var.lambda_triggers, "pre_token_generation", null)
      user_migration                 = lookup(var.lambda_triggers, "user_migration", null)
      verify_auth_challenge_response = lookup(var.lambda_triggers, "verify_auth_challenge_response", null)
    }
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Domain configuration
resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}

# Create app clients from the variable
resource "aws_cognito_user_pool_client" "clients" {
  for_each = { for idx, client in var.clients : client.name => client }

  name                                 = each.value.name
  user_pool_id                         = aws_cognito_user_pool.main.id
  generate_secret                      = each.value.generate_secret
  callback_urls                        = each.value.callback_urls
  logout_urls                          = each.value.logout_urls
  allowed_oauth_flows                  = each.value.allowed_oauth_flows
  allowed_oauth_scopes                 = each.value.allowed_oauth_scopes
  allowed_oauth_flows_user_pool_client = each.value.allowed_oauth_flows_user_pool_client
  supported_identity_providers         = each.value.supported_identity_providers

  # Enable token revocation for better security
  enable_token_revocation = true

  # Prevent user existence errors for better security
  prevent_user_existence_errors = "ENABLED"

  # Set the token validity configuration
  refresh_token_validity = 30 # days
  access_token_validity  = 1  # hours
  id_token_validity      = 1  # hours

  # Standard authentication flow
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

# Local values for client outputs - placed after client resources are created
locals {
  main_client_exists = var.main_client_name != "" && contains(keys(aws_cognito_user_pool_client.clients), var.main_client_name)
  client_id          = local.main_client_exists ? aws_cognito_user_pool_client.clients[var.main_client_name].id : "none"
  # Use try function to safely access callback_urls, and providing a default if it doesn't exist
  callback_url = local.main_client_exists ? try(aws_cognito_user_pool_client.clients[var.main_client_name].callback_urls[0], "none") : "none"
}

# Create identity pool if enabled
resource "aws_cognito_identity_pool" "main" {
  count                            = var.create_identity_pool ? 1 : 0
  identity_pool_name               = "${var.user_pool_name}-identity-pool"
  allow_unauthenticated_identities = var.allow_unauthenticated_identities
  allow_classic_flow               = true

  # Connect to our User Pool
  cognito_identity_providers {
    client_id               = local.client_id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }

  # Add additional providers if provided
  dynamic "cognito_identity_providers" {
    for_each = [for client_name, client in aws_cognito_user_pool_client.clients : client if client_name != var.main_client_name]
    content {
      client_id               = cognito_identity_providers.value.id
      provider_name           = aws_cognito_user_pool.main.endpoint
      server_side_token_check = false
    }
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Identity pool roles
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  count            = var.create_identity_pool ? 1 : 0
  identity_pool_id = aws_cognito_identity_pool.main[0].id

  # Basic role mapping
  roles = {
    "authenticated"   = var.authenticated_role_arn != null ? var.authenticated_role_arn : aws_iam_role.authenticated_role[0].arn
    "unauthenticated" = var.unauthenticated_role_arn != null ? var.unauthenticated_role_arn : aws_iam_role.unauthenticated_role[0].arn
  }
}

# Create authenticated IAM role if not provided
resource "aws_iam_role" "authenticated_role" {
  count = (var.create_identity_pool && var.authenticated_role_arn == null) ? 1 : 0
  name  = "${var.user_pool_name}-authenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main[0].id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Authenticated role policy
resource "aws_iam_role_policy" "authenticated_policy" {
  count = (var.create_identity_pool && var.authenticated_role_arn == null) ? 1 : 0
  name  = "authenticated-policy"
  role  = aws_iam_role.authenticated_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Effect = "Allow"
          Action = [
            "cognito-sync:*",
            "cognito-identity:*"
          ]
          Resource = "*"
        }
      ],
      # Only add API Gateway permissions if ARNs are provided
      length(var.api_gateway_arns) > 0 ? [
        {
          Effect = "Allow"
          Action = [
            "execute-api:Invoke"
          ]
          Resource = var.api_gateway_arns
        }
      ] : []
    )
  })
}

# Create unauthenticated IAM role if not provided
resource "aws_iam_role" "unauthenticated_role" {
  count = (var.create_identity_pool && var.unauthenticated_role_arn == null) ? 1 : 0
  name  = "${var.user_pool_name}-unauthenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main[0].id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Unauthenticated role policy
resource "aws_iam_role_policy" "unauthenticated_policy" {
  count = (var.create_identity_pool && var.unauthenticated_role_arn == null) ? 1 : 0
  name  = "unauthenticated-policy"
  role  = aws_iam_role.unauthenticated_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Effect = "Allow"
          Action = [
            "cognito-sync:*"
          ]
          Resource = "*"
        }
      ],
      # Only add API Gateway permissions if ARNs are provided
      length(var.public_api_gateway_arns) > 0 ? [
        {
          Effect = "Allow"
          Action = [
            "execute-api:Invoke"
          ]
          Resource = var.public_api_gateway_arns
        }
      ] : []
    )
  })
}
