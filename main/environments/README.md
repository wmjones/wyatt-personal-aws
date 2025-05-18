# Environment Configuration

This directory contains environment-specific variable files for deploying the infrastructure to different environments.

## Available Environments

- `dev.tfvars`: Development environment configuration
- `prod.tfvars`: Production environment configuration

## Usage

### Manual Deployment

To deploy to a specific environment:

```bash
# Deploy to development environment
terraform apply -var-file=environments/dev.tfvars

# Deploy to production environment
terraform apply -var-file=environments/prod.tfvars
```

### Using the Deployment Script

You can use the provided script for a guided deployment:

```bash
# Interactive deployment to development environment
../../scripts/deploy.sh dev

# Interactive deployment to production environment
../../scripts/deploy.sh prod

# Non-interactive plan for development environment
../../scripts/deploy.sh dev plan

# Non-interactive apply for production environment
../../scripts/deploy.sh prod apply
```

### CI/CD with GitHub Actions

The project includes a GitHub Actions workflow that automatically deploys:
- When code is pushed to the `dev` branch, it deploys to the development environment
- When code is pushed to the `main` branch, it deploys to the production environment
- Pull requests to either branch will trigger a plan but not apply

The workflow is configured in `/.github/workflows/terraform-deploy.yml` and uses the same deployment script.

## Environment Variables

Each environment file contains the following variables:

| Variable Name | Description | Example Values |
|---------------|-------------|----------------|
| `environment` | Name of the environment | `"dev"`, `"prod"` |
| `aws_region` | AWS region for deployment | `"us-east-2"` |
| `project_name` | Name of the project for resource naming | `"wyatt-personal-aws"` |
| `domain_name` | Base domain name for the application | `"example.com"` |
| `app_prefix` | Prefix for application subdomain | `"app-dev"`, `"app"` |
| `cognito_domain_prefix` | Prefix for Cognito domain | `"wyatt-personal-aws-dev"` |
| `vpc_cidr` | CIDR block for the VPC | `"10.0.0.0/16"` |
| `single_nat_gateway` | Use a single NAT gateway | `true` (dev), `false` (prod) |
| `one_nat_gateway_per_az` | Use one NAT gateway per AZ | `false` (dev), `true` (prod) |
| `create_interface_endpoints` | Create VPC interface endpoints | `false` (dev), `true` (prod) |
| `cognito_deletion_protection` | Enable Cognito deletion protection | `false` (dev), `true` (prod) |
| `dynamodb_billing_mode` | DynamoDB billing mode | `"PAY_PER_REQUEST"` |
| `dynamodb_point_in_time_recovery` | Enable DynamoDB point-in-time recovery | `false` (dev), `true` (prod) |
| `lambda_runtime` | Lambda function runtime | `"python3.10"` |
| `websocket_api_name` | Name for the WebSocket API | `"dashboard-websocket-dev"` |
| `step_function_name` | Name for the Step Function | `"todoist-workflow-dev"` |

## Environment-Specific Differences

### Development Environment (`dev.tfvars`)

The development environment uses cost-optimized settings:
- Single NAT gateway for all subnets
- No VPC interface endpoints to reduce costs
- No DynamoDB point-in-time recovery
- No Cognito deletion protection
- Resources named with `-dev` suffix

### Production Environment (`prod.tfvars`)

The production environment uses high-availability and security-optimized settings:
- One NAT gateway per availability zone for high availability
- VPC interface endpoints for enhanced security and performance
- DynamoDB point-in-time recovery enabled
- Cognito deletion protection enabled
- Resources named with `-prod` suffix

## Adding New Variables

When adding new environment-specific configuration:

1. Add the variable to both `dev.tfvars` and `prod.tfvars` files
2. Add a corresponding variable declaration in `variables.tf` with an appropriate default value
3. Update this README.md with the new variable information
