# Environment Configuration for Hybrid Architecture

## Overview

This document outlines the environment configuration strategy for the hybrid architecture, where the Next.js frontend is deployed on Vercel while the backend remains on AWS. The configuration ensures seamless integration between both platforms across development, staging, and production environments.

## Environment Structure

### Development Environment

```
Frontend (Local):
- URL: http://localhost:3000
- Server: Next.js dev server
- Hot reload enabled
- Source maps enabled

Backend (AWS Dev):
- API Gateway: https://api-dev.your-domain.com
- WebSocket: wss://ws-dev.your-domain.com
- DynamoDB: dev-tables
- Cognito: dev-user-pool
```

### Staging Environment

```
Frontend (Vercel Preview):
- URL: https://preview-*.vercel.app
- Server: Vercel edge functions
- Branch deployments
- Preview for each PR

Backend (AWS Staging):
- API Gateway: https://api-staging.your-domain.com
- WebSocket: wss://ws-staging.your-domain.com
- DynamoDB: staging-tables
- Cognito: staging-user-pool
```

### Production Environment

```
Frontend (Vercel Production):
- URL: https://app.your-domain.com
- Server: Vercel edge network
- CDN caching enabled
- Optimized builds

Backend (AWS Production):
- API Gateway: https://api.your-domain.com
- WebSocket: wss://ws.your-domain.com
- DynamoDB: prod-tables
- Cognito: prod-user-pool
```

## Environment Variables

### Frontend Environment Variables (Vercel)

```bash
# .env.local (Development)
NEXT_PUBLIC_AWS_API_ENDPOINT=http://localhost:4000
NEXT_PUBLIC_AWS_WEBSOCKET_ENDPOINT=ws://localhost:8080
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=us-east-1_dev123
NEXT_PUBLIC_USER_POOL_CLIENT_ID=dev-client-123
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# .env.staging (Staging)
NEXT_PUBLIC_AWS_API_ENDPOINT=https://api-staging.your-domain.com
NEXT_PUBLIC_AWS_WEBSOCKET_ENDPOINT=wss://ws-staging.your-domain.com
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=us-east-1_staging456
NEXT_PUBLIC_USER_POOL_CLIENT_ID=staging-client-456
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# .env.production (Production)
NEXT_PUBLIC_AWS_API_ENDPOINT=https://api.your-domain.com
NEXT_PUBLIC_AWS_WEBSOCKET_ENDPOINT=wss://ws.your-domain.com
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=us-east-1_prod789
NEXT_PUBLIC_USER_POOL_CLIENT_ID=prod-client-789
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Backend Environment Variables (AWS Lambda)

```json
// Development
{
  "ENVIRONMENT": "dev",
  "TABLE_NAME_PREFIX": "dev-",
  "ALLOWED_ORIGINS": "http://localhost:3000,https://preview-*.vercel.app",
  "LOG_LEVEL": "DEBUG",
  "ENABLE_XRAY": "false"
}

// Staging
{
  "ENVIRONMENT": "staging",
  "TABLE_NAME_PREFIX": "staging-",
  "ALLOWED_ORIGINS": "https://staging.your-domain.com,https://preview-*.vercel.app",
  "LOG_LEVEL": "INFO",
  "ENABLE_XRAY": "true"
}

// Production
{
  "ENVIRONMENT": "prod",
  "TABLE_NAME_PREFIX": "prod-",
  "ALLOWED_ORIGINS": "https://app.your-domain.com",
  "LOG_LEVEL": "WARN",
  "ENABLE_XRAY": "true"
}
```

## Vercel Configuration

### Project Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_AWS_API_ENDPOINT": "@aws_api_endpoint",
    "NEXT_PUBLIC_AWS_WEBSOCKET_ENDPOINT": "@aws_websocket_endpoint",
    "NEXT_PUBLIC_AWS_REGION": "@aws_region",
    "NEXT_PUBLIC_USER_POOL_ID": "@cognito_user_pool_id",
    "NEXT_PUBLIC_USER_POOL_CLIENT_ID": "@cognito_client_id"
  },
  "regions": ["iad1"],
  "functions": {
    "app/api/*": {
      "maxDuration": 30
    }
  }
}
```

### Environment Variable Setup

1. **Development Variables**
   ```bash
   vercel env add NEXT_PUBLIC_AWS_API_ENDPOINT development
   vercel env add NEXT_PUBLIC_AWS_WEBSOCKET_ENDPOINT development
   vercel env add NEXT_PUBLIC_AWS_REGION development
   vercel env add NEXT_PUBLIC_USER_POOL_ID development
   vercel env add NEXT_PUBLIC_USER_POOL_CLIENT_ID development
   ```

2. **Preview Variables**
   ```bash
   vercel env add NEXT_PUBLIC_AWS_API_ENDPOINT preview
   vercel env add NEXT_PUBLIC_AWS_WEBSOCKET_ENDPOINT preview
   vercel env add NEXT_PUBLIC_AWS_REGION preview
   vercel env add NEXT_PUBLIC_USER_POOL_ID preview
   vercel env add NEXT_PUBLIC_USER_POOL_CLIENT_ID preview
   ```

3. **Production Variables**
   ```bash
   vercel env add NEXT_PUBLIC_AWS_API_ENDPOINT production
   vercel env add NEXT_PUBLIC_AWS_WEBSOCKET_ENDPOINT production
   vercel env add NEXT_PUBLIC_AWS_REGION production
   vercel env add NEXT_PUBLIC_USER_POOL_ID production
   vercel env add NEXT_PUBLIC_USER_POOL_CLIENT_ID production
   ```

## AWS Configuration

### API Gateway CORS Configuration

```terraform
# terraform/environments/dev.tfvars
cors_allowed_origins = [
  "http://localhost:3000",
  "https://preview-*.vercel.app"
]

# terraform/environments/staging.tfvars
cors_allowed_origins = [
  "https://staging.your-domain.com",
  "https://preview-*.vercel.app"
]

# terraform/environments/prod.tfvars
cors_allowed_origins = [
  "https://app.your-domain.com"
]
```

### Lambda Environment Variables

```terraform
module "api_lambda" {
  source = "./modules/lambda_function"

  environment_variables = {
    ENVIRONMENT        = var.environment
    TABLE_NAME_PREFIX  = "${var.environment}-"
    ALLOWED_ORIGINS    = join(",", var.cors_allowed_origins)
    LOG_LEVEL         = var.log_level
    ENABLE_XRAY       = var.enable_xray
  }
}
```

## Configuration Management

### Environment-Specific Configuration

```typescript
// config/environment.ts
export interface EnvironmentConfig {
  api: {
    baseUrl: string;
    websocketUrl: string;
    timeout: number;
  };
  auth: {
    region: string;
    userPoolId: string;
    clientId: string;
  };
  features: {
    enableWebsocket: boolean;
    enableAnalytics: boolean;
  };
}

const config: EnvironmentConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_AWS_API_ENDPOINT!,
    websocketUrl: process.env.NEXT_PUBLIC_AWS_WEBSOCKET_ENDPOINT!,
    timeout: 30000,
  },
  auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION!,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
    clientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
  },
  features: {
    enableWebsocket: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },
};

export default config;
```

### Dynamic Configuration Loading

```typescript
// utils/loadConfig.ts
export async function loadConfig(): Promise<EnvironmentConfig> {
  const response = await fetch('/api/config');
  const config = await response.json();

  // Merge with environment variables
  return {
    ...config,
    api: {
      ...config.api,
      baseUrl: process.env.NEXT_PUBLIC_AWS_API_ENDPOINT || config.api.baseUrl,
    },
  };
}
```

## Secrets Management

### Vercel Secrets

```bash
# API Keys (not exposed to client)
vercel secrets add todoist_api_key "your-todoist-key"
vercel secrets add openai_api_key "your-openai-key"
vercel secrets add notion_api_key "your-notion-key"

# Reference in environment variables
TODOIST_API_KEY=@todoist_api_key
OPENAI_API_KEY=@openai_api_key
NOTION_API_KEY=@notion_api_key
```

### AWS Secrets Manager

```terraform
resource "aws_secretsmanager_secret" "api_keys" {
  name = "${var.project_name}-api-keys-${var.environment}"
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    todoist_api_key = var.todoist_api_key
    openai_api_key  = var.openai_api_key
    notion_api_key  = var.notion_api_key
  })
}
```

## Deployment Configuration

### GitHub Actions Workflow

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }} --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build ${{ github.ref == 'refs/heads/main' && '--prod' || '' }} --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt ${{ github.ref == 'refs/heads/main' && '--prod' || '' }} --token=${{ secrets.VERCEL_TOKEN }}
```

## Monitoring and Logging

### Frontend Monitoring (Vercel)

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Backend Monitoring (AWS)

```python
# Lambda function monitoring
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit

logger = Logger()
tracer = Tracer()
metrics = Metrics()

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def handler(event, context):
    logger.info("Request received", extra={"path": event.get("path")})

    # Add custom metrics
    metrics.add_metric(name="RequestCount", unit=MetricUnit.Count, value=1)

    # Your handler logic here
    return response
```

## Best Practices

### Environment Variable Naming

1. **Frontend Variables** (exposed to browser):
   - Prefix with `NEXT_PUBLIC_`
   - Use UPPER_SNAKE_CASE
   - Example: `NEXT_PUBLIC_AWS_API_ENDPOINT`

2. **Backend Variables** (server-side only):
   - No prefix required
   - Use UPPER_SNAKE_CASE
   - Example: `DATABASE_CONNECTION_STRING`

### Configuration Validation

```typescript
// utils/validateConfig.ts
export function validateConfig(config: EnvironmentConfig): void {
  const required = [
    'api.baseUrl',
    'api.websocketUrl',
    'auth.region',
    'auth.userPoolId',
    'auth.clientId',
  ];

  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }
}
```

### Environment Isolation

1. **Separate AWS Accounts** (recommended for production):
   - Development: Shared development account
   - Staging: Separate staging account
   - Production: Isolated production account

2. **Resource Naming Convention**:
   ```
   ${project_name}-${resource_type}-${environment}
   Example: myapp-api-gateway-prod
   ```

3. **Network Isolation**:
   - Use VPCs for backend resources
   - Security groups for access control
   - Private subnets for databases

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   ```javascript
   // Check allowed origins in Lambda
   console.log('Allowed origins:', process.env.ALLOWED_ORIGINS);
   console.log('Request origin:', event.headers.origin);
   ```

2. **Environment Variable Not Found**:
   ```bash
   # Verify Vercel environment variables
   vercel env ls

   # Check specific variable
   vercel env get NEXT_PUBLIC_AWS_API_ENDPOINT
   ```

3. **WebSocket Connection Failed**:
   ```typescript
   // Add debug logging
   console.log('WebSocket URL:', config.api.websocketUrl);
   console.log('Auth token:', token ? 'present' : 'missing');
   ```

### Debug Mode

```typescript
// config/debug.ts
export const debugConfig = {
  logApiCalls: process.env.NODE_ENV === 'development',
  logWebSocketMessages: process.env.NEXT_PUBLIC_DEBUG_WEBSOCKET === 'true',
  logAuthFlow: process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true',
};
```

## Migration Guide

### Moving from Development to Production

1. **Update Environment Variables**:
   ```bash
   # Export development variables
   vercel env pull .env.development

   # Update for production
   sed 's/dev/prod/g' .env.development > .env.production

   # Push to production
   vercel env add < .env.production
   ```

2. **Update AWS Resources**:
   ```bash
   # Apply production configuration
   terraform workspace select prod
   terraform apply -var-file=environments/prod.tfvars
   ```

3. **Verify Configuration**:
   ```bash
   # Test API endpoint
   curl https://api.your-domain.com/health

   # Test WebSocket
   wscat -c wss://ws.your-domain.com
   ```

## Security Considerations

### Environment Variable Security

1. **Never commit sensitive values**:
   ```bash
   # .gitignore
   .env*.local
   .env.production
   ```

2. **Use Vercel secrets for sensitive data**:
   ```bash
   vercel secrets add aws_secret_key "your-secret-key"
   ```

3. **Rotate credentials regularly**:
   - Set up AWS IAM key rotation
   - Update Vercel secrets quarterly
   - Monitor access logs

### Access Control

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
```

## Conclusion

This environment configuration strategy ensures smooth operation of the hybrid architecture across all environments. By properly managing environment variables, secrets, and configurations, we maintain security while enabling rapid development and deployment cycles.</content>
