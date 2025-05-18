# SSM Parameters Module

This module manages AWS Systems Manager (SSM) Parameter Store parameters for storing configuration values that need to be accessed by the frontend application.

## Purpose

This module exports Terraform outputs as SSM parameters, making them available to the frontend application at runtime. This enables dynamic configuration without hardcoding values in the application code.

## Features

- Creates SSM parameters from Terraform outputs
- Supports both development and production environments
- Uses hierarchical naming convention for easy organization
- Implements appropriate tagging for resource management

## Usage

```hcl
module "ssm_parameters" {
  source = "./modules/ssm_parameters"

  project = var.project
  environment = var.environment

  parameters = {
    api_gateway_url      = module.api_gateway.api_url
    websocket_api_url    = module.websocket_api.websocket_url
    cognito_user_pool_id = module.cognito.user_pool_id
    cognito_client_id    = module.cognito.client_id
    s3_static_bucket     = module.frontend.static_bucket_name
    cloudfront_url       = module.frontend.cloudfront_distribution_url
  }
}
```

## Naming Convention

Parameters are created with the following naming pattern:
`/{project}/{environment}/{parameter_name}`

For example:
- `/wyatt-personal-aws/dev/api_gateway_url`
- `/wyatt-personal-aws/prod/cognito_user_pool_id`

## Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| project | Project name | `string` | n/a | yes |
| environment | Environment name (dev, prod) | `string` | n/a | yes |
| parameters | Map of parameter names and values | `map(string)` | n/a | yes |
| secure_parameters | Map of secure parameter names and values | `map(string)` | `{}` | no |
| secure_parameter_names | List of secure parameter names (use when secure_parameters has sensitive values) | `set(string)` | `[]` | no |

## Outputs

| Name | Description |
|------|-------------|
| parameter_arns | Map of parameter names to their ARNs |
| parameter_names | Map of parameter names to their full paths |

## Security Considerations

- Parameters are created as `String` type for non-sensitive values
- For sensitive values (like API keys), use `SecureString` type
- IAM permissions should be properly configured to limit access

## Working with Sensitive Values

If you encounter errors with sensitive values in `for_each`, you can provide the parameter names separately:

```hcl
module "ssm_parameters" {
  source = "./modules/ssm_parameters"

  project     = var.project
  environment = var.environment

  parameters = {
    api_gateway_url = module.api_gateway.api_url
    cognito_user_pool_id = module.cognito.user_pool_id
  }

  # When secure_parameters has sensitive values
  secure_parameters = {
    api_key = sensitive(var.api_key)
    secret_key = sensitive(var.secret_key)
  }

  # Provide names separately to avoid for_each issues
  secure_parameter_names = ["api_key", "secret_key"]
}
```
