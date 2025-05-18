# Cognito Module

## Overview

This module creates and configures AWS Cognito User Pools and Identity Pools for user authentication and authorization in the D3 Visualization Dashboard. It provides a complete authentication solution with customizable settings for sign-up, sign-in, and user management.

## Components

- **User Pool**: Manages user directories, authentication, account confirmation, and recovery
- **App Clients**: Client-side applications that can authenticate with the User Pool
- **Domain**: Custom domain for the Cognito-hosted UI
- **Identity Pool**: (Optional) For providing AWS credentials to authenticated users
- **Triggers**: Lambda triggers for custom authentication workflows

## Variables

| Name | Description | Type | Required |
|------|-------------|------|----------|
| `user_pool_name` | Name of the Cognito User Pool | `string` | Yes |
| `domain_prefix` | Prefix for the Cognito-hosted UI domain | `string` | No |
| `client_allowed_oauth_flows` | List of allowed OAuth flows | `list(string)` | No |
| `client_callback_urls` | List of allowed callback URLs | `list(string)` | Yes |
| `client_logout_urls` | List of allowed logout URLs | `list(string)` | Yes |
| `client_default_redirect_uri` | Default redirect URI after login | `string` | No |
| `client_supported_identity_providers` | List of supported identity providers | `list(string)` | No |
| `password_policy` | Password policy configuration | `map(any)` | No |
| `mfa_configuration` | MFA configuration | `string` | No |
| `lambda_triggers` | Map of Lambda triggers for authentication workflows | `map(string)` | No |
| `tags` | Resource tags | `map(string)` | No |

## Outputs

| Name | Description |
|------|-------------|
| `user_pool_id` | ID of the created User Pool |
| `user_pool_arn` | ARN of the User Pool |
| `user_pool_client_id` | ID of the User Pool Client |
| `user_pool_domain` | Domain name for the Cognito-hosted UI |
| `identity_pool_id` | ID of the Identity Pool (if created) |

## Integration with Project

The Cognito module is a fundamental security component in the D3 Dashboard architecture:

- **User Authentication**: Provides secure sign-up and sign-in capabilities for dashboard users
- **API Authorization**: Issues JWT tokens that are validated by API Gateway before allowing access to protected endpoints
- **User Management**: Handles user profile data, password resets, and account recovery
- **Social Identity Federation**: (Optional) Enables login via social identity providers
- **Security Compliance**: Enforces password policies and multi-factor authentication

This module works closely with the Frontend module (for login UI integration) and the API Gateway module (for securing API endpoints).
