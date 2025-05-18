# API Gateway Module

## Overview

This module creates and configures an HTTP API Gateway that serves as the backend API endpoint for the D3 Visualization Dashboard. It handles routing HTTP requests to appropriate Lambda functions and enforces authentication via Cognito.

## Components

- **HTTP API Gateway**: Creates a RESTful API endpoint
- **API Routes**: Configures paths and methods for API endpoints
- **Lambda Integrations**: Connects API routes to Lambda functions
- **CORS Configuration**: Enables cross-origin resource sharing
- **Authorization**: Integrates with Cognito for JWT-based authorization

## Variables

| Name | Description | Type | Required |
|------|-------------|------|----------|
| `api_name` | Name of the API Gateway | `string` | Yes |
| `api_description` | Description of the API Gateway | `string` | No |
| `allowed_origins` | List of allowed origins for CORS | `list(string)` | No |
| `integrations` | Map of API Gateway route integrations (key is route, value contains integration_uri or arn) | `map(any)` | Yes |
| `create_custom_domain` | Whether to create a custom domain | `bool` | No |
| `domain_name` | Custom domain name (required if create_custom_domain is true) | `string` | No |
| `certificate_arn` | Certificate ARN (required if create_custom_domain is true) | `string` | No |
| `create_logs` | Whether to create CloudWatch logs | `bool` | No |
| `tags` | Resource tags | `map(string)` | No |

## Outputs

| Name | Description |
|------|-------------|
| `api_id` | ID of the created API Gateway |
| `api_endpoint` | Endpoint URL of the API Gateway |
| `api_arn` | ARN of the API Gateway |
| `execution_arn` | Execution ARN for Lambda permissions |

## Integration with Project

The API Gateway module is a critical component in the D3 Dashboard architecture:

- **Frontend Integration**: The React SPA communicates with this API to fetch and update visualization data
- **Authentication Flow**: Works with Cognito to validate user tokens before allowing access to protected endpoints
- **Backend Processing**: Routes requests to appropriate Lambda functions based on the endpoint path and method
- **Security Boundary**: Provides a secure interface for accessing backend resources and data

This module is used in conjunction with the Lambda Function module to create a complete serverless backend for the application.

## Usage Example

```hcl
module "api_gateway" {
  source = "./modules/api_gateway"

  api_name        = "my-api"
  api_description = "API for D3 Dashboard"

  allowed_origins = ["https://dashboard.example.com"]

  integrations = {
    "GET /items" = {
      integration_uri    = module.get_items_lambda.function_invoke_arn
      integration_type   = "AWS_PROXY"
      integration_method = "POST"
    },
    "POST /items" = {
      integration_uri    = module.create_item_lambda.function_invoke_arn
      integration_type   = "AWS_PROXY"
      integration_method = "POST"
    }
  }

  create_custom_domain = true
  domain_name          = "api.example.com"
  certificate_arn      = "arn:aws:acm:us-east-1:123456789012:certificate/abcdef-1234-5678-abcd-12345678"

  tags = {
    Environment = "production"
    Project     = "D3Dashboard"
  }
}
```

Note that the `integrations` map requires the `integration_uri` attribute for each integration, which is typically the invoke ARN of a Lambda function.
