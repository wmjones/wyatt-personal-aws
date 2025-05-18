# Cognito Authentication Configuration

This document provides information about the Cognito authentication setup and how to troubleshoot common issues.

## Configuration Overview

The React application uses AWS Cognito for authentication. It requires two key configuration values:

1. **User Pool ID** (`REACT_APP_USER_POOL_ID`)
2. **User Pool Client ID** (`REACT_APP_USER_POOL_CLIENT_ID`)

These values are stored in AWS SSM Parameter Store and injected into the environment during the build process.

## Common Issues

### "User pool client does not exist" Error

This error occurs when the React application is trying to authenticate using invalid or missing Cognito configuration.

#### Potential Causes

1. **SSM Parameters Missing**: The SSM parameters containing the Cognito IDs are not available.
2. **Terraform Output Not Stored**: The `store-terraform-outputs.sh` script has not been run after Terraform apply.
3. **Environment Variables Not Set**: The `.env.production.local` file contains placeholder values.

#### How to Fix

1. **Check SSM Parameters**:
   ```bash
   # For development environment
   aws ssm get-parameter --name "/wyatt-personal-aws-dev/cognito_user_pool_id" --query "Parameter.Value" --output text
   aws ssm get-parameter --name "/wyatt-personal-aws-dev/cognito_client_id" --query "Parameter.Value" --output text

   # For production environment
   aws ssm get-parameter --name "/wyatt-personal-aws-prod/cognito_user_pool_id" --query "Parameter.Value" --output text
   aws ssm get-parameter --name "/wyatt-personal-aws-prod/cognito_client_id" --query "Parameter.Value" --output text
   ```

2. **Run the Verification Script**:
   ```bash
   # Check configuration for development environment
   ./scripts/verify-cognito-config.sh dev

   # Check configuration for production environment
   ./scripts/verify-cognito-config.sh prod
   ```

3. **Store Terraform Outputs as SSM Parameters**:
   ```bash
   # For development environment
   ./scripts/store-terraform-outputs.sh dev

   # For production environment
   ./scripts/store-terraform-outputs.sh prod
   ```

4. **Set Environment Variables Manually (for local development)**:
   ```bash
   # Create or update .env.development.local
   echo "REACT_APP_USER_POOL_ID=YOUR_USER_POOL_ID" > .env.development.local
   echo "REACT_APP_USER_POOL_CLIENT_ID=YOUR_CLIENT_ID" >> .env.development.local
   echo "REACT_APP_API_ENDPOINT=YOUR_API_ENDPOINT" >> .env.development.local
   ```

## Error Handling

The application includes improved error handling for authentication configuration issues:

1. **Better Error Messages**: User-friendly error messages replace cryptic AWS errors.
2. **Configuration Checks**: The application checks for placeholder values to detect misconfiguration.
3. **Debug Information**: In development mode, detailed configuration information is logged to help troubleshoot issues.

## CI/CD Integration

The GitHub workflow for frontend deployment:

1. Gets Cognito configuration from SSM parameters
2. Sets these values as environment variables during build
3. Deploys the built application to S3

If the SSM parameters don't exist, the deployment will still succeed, but the application will show configuration error messages when users try to authenticate.

## Development Mode

In development mode (`NODE_ENV === 'development'`), the application uses mock authentication instead of real Cognito authentication. This allows for development without requiring actual Cognito resources.

Use these credentials for testing:
- Email: `demo@example.com`
- Password: `password`
