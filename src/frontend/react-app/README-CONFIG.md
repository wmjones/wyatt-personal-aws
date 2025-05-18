# React App Configuration Guide

This document explains how to configure the React application to connect with AWS services like Cognito and API Gateway.

## Configuration Overview

The React app needs to be configured with AWS resource identifiers such as:
- Cognito User Pool ID
- Cognito App Client ID
- API Gateway Endpoint
- AWS Region

There are two ways these values are configured:

1. **Environment Variables** - Used during the build process
2. **Runtime Configuration** - Code that reads these values at runtime

## Environment Variables

The application uses React's built-in environment variables system with the `REACT_APP_` prefix. The following variables are used:

```
REACT_APP_STAGE=dev|prod
REACT_APP_REGION=us-east-2
REACT_APP_USER_POOL_ID=us-east-2_xxxxxxxx
REACT_APP_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_API_ENDPOINT=https://api.example.com
```

## Configuration Flow

### 1. Terraform Deployment

When you run `terraform apply`, the infrastructure is created and outputs are generated:
- `cognito_user_pool_id`
- `cognito_client_id`
- `api_endpoint`
- etc.

### 2. Storing Configuration

After Terraform deployment, run the script to store these values in SSM Parameter Store:

```bash
bash scripts/store-terraform-outputs.sh dev
```

This makes the values available for CI/CD and local development.

### 3. CI/CD Pipeline

The GitHub Actions workflow automatically:
1. Retrieves values from SSM Parameter Store
2. Writes them to `.env.production.local` before build
3. React's build process injects them into the JavaScript bundles

### 4. Local Development

For local development, create a `.env.development.local` file in the `src/frontend/react-app` directory:

```
REACT_APP_STAGE=dev
REACT_APP_REGION=us-east-2
REACT_APP_USER_POOL_ID=<your-user-pool-id>
REACT_APP_USER_POOL_CLIENT_ID=<your-client-id>
REACT_APP_API_ENDPOINT=<your-api-endpoint>
```

You can get these values by:
1. Running `terraform output` in the `main` directory, or
2. Checking the SSM Parameter Store in the AWS Console, or
3. Running `aws ssm get-parameter --name "/wyatt-personal-aws-dev/cognito_user_pool_id" --query "Parameter.Value" --output text`

## Accessing the Configuration in Code

The auth.ts and api.ts files are set up to read these values from the environment. For example:

```typescript
// From auth.ts
const getEnvConfig = (): AmplifyConfig => {
  return {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID || 'us-east-1_xxxxxxxx',
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
      region: process.env.REACT_APP_REGION || 'us-east-1',
    },
    // ...
  };
};
```

## Troubleshooting

### Missing Environment Variables

If your app can't connect to AWS services, check:

1. That the SSM parameters exist:
   ```bash
   aws ssm get-parameter --name "/wyatt-personal-aws-dev/cognito_user_pool_id" --query "Parameter.Value" --output text
   ```

2. That the environment variables are set during build:
   - Look at CI/CD build logs
   - For local builds, check your `.env.development.local` file

3. Run the `store-terraform-outputs.sh` script again after any infrastructure changes

### Authentication Issues

If you can't authenticate with Cognito:

1. Verify the User Pool ID and Client ID are correct
2. Check that the Client has the correct OAuth flows and scopes in Cognito
3. Ensure your Cognito settings allow sign-up and sign-in
