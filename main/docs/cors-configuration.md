# CORS and API Security Configuration

This document explains the CORS (Cross-Origin Resource Sharing) and security configuration for the D3 Dashboard API Gateway.

## CORS Configuration

The API Gateway is configured to allow cross-origin requests from:

### Development Environment
- `http://localhost:3000` - Local Next.js development server
- `http://localhost:3001` - Alternative local development port
- `https://*.vercel.app` - All Vercel preview deployments (development only)
- Custom Vercel deployment URL (if specified)

### Production Environment
- `https://app.example.com` - Production domain (replace with actual domain)
- Custom Vercel deployment URL (if specified)
- Additional origins can be added through `vercel_app_url` variable

### Allowed Methods
- GET, POST, PUT, DELETE, OPTIONS, PATCH

### Allowed Headers
- Content-Type
- Authorization
- X-Amz-Date
- X-Api-Key
- X-Amz-Security-Token

## JWT Authorization

All API endpoints are protected with JWT authorization using AWS Cognito:

### Configuration
- **Authorizer Type**: JWT
- **Identity Source**: `$request.header.Authorization`
- **Token Issuer**: `https://cognito-idp.{region}.amazonaws.com/{user-pool-id}`
- **Audience**: Cognito User Pool Client ID

### Protected Endpoints
All visualization API endpoints require a valid JWT token:
- `GET /api/visualizations`
- `GET /api/visualizations/{id}`
- `POST /api/visualizations`
- `PUT /api/visualizations/{id}`
- `DELETE /api/visualizations/{id}`

## Environment Variables

### Frontend (Next.js) Environment Variables
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com  # API Gateway endpoint

# AWS Cognito Configuration
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_USER_POOL_ID=<cognito-user-pool-id>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<cognito-client-id>
```

### Infrastructure Variables
```hcl
# CORS Configuration
vercel_app_url = "https://myapp.vercel.app"  # Your Vercel deployment URL

# Domain Configuration
domain_name = "example.com"
app_prefix = "app"  # Results in app.example.com
```

## Deployment Process

1. Update the `vercel_app_url` variable in the appropriate environment file:
   - `environments/dev.tfvars` for development
   - `environments/prod.tfvars` for production

2. Apply Terraform changes:
   ```bash
   terraform plan -var-file=environments/dev.tfvars
   terraform apply -var-file=environments/dev.tfvars
   ```

3. Update Next.js environment variables in Vercel dashboard:
   - Set `NEXT_PUBLIC_API_URL` to the API Gateway endpoint (output from Terraform)
   - Set Cognito configuration variables

4. Deploy frontend to Vercel:
   ```bash
   vercel --prod
   ```

## Security Best Practices

1. **Token Validation**: All API requests must include a valid JWT token in the Authorization header
2. **CORS Origins**: Only explicitly allowed origins can make cross-origin requests
3. **HTTPS Only**: All production communication must use HTTPS
4. **Environment Separation**: Development and production use separate configuration

## Troubleshooting

### CORS Errors
If you encounter CORS errors:
1. Verify the origin is included in `allowed_origins`
2. Check that the request includes proper headers
3. Ensure the API Gateway stage has been deployed

### Authentication Errors
If you encounter 401/403 errors:
1. Verify the JWT token is included in the Authorization header
2. Check that the token hasn't expired
3. Ensure the token is from the correct Cognito User Pool
4. Verify the audience matches the User Pool Client ID
