# SSM Parameter Management and Frontend Deployment Workflow

This document describes the automated SSM parameter management system and robust frontend deployment workflow for the Wyatt Personal AWS project.

## Overview

The new workflow consists of two main components:

1. **SSM Parameter Management**: Automatically syncs Terraform outputs to AWS Systems Manager Parameter Store
2. **Frontend Deployment**: Robust deployment script that reads SSM parameters and deploys with proper error handling and rollback capabilities

## SSM Parameter Management

### Terraform Module

A new Terraform module (`main/modules/ssm_parameters`) has been created to manage SSM parameters:

```hcl
module "ssm_parameters" {
  source = "./modules/ssm_parameters"

  project     = var.project
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

### Sync Script

The `sync-terraform-outputs-to-ssm.sh` script syncs Terraform outputs to SSM:

```bash
# Sync current workspace outputs
./scripts/sync-terraform-outputs-to-ssm.sh

# Sync specific workspace
./scripts/sync-terraform-outputs-to-ssm.sh --workspace prod

# Dry run to see what would be changed
./scripts/sync-terraform-outputs-to-ssm.sh --dry-run
```

### Parameter Naming Convention

Parameters follow a hierarchical naming convention:
- `/{project}/{environment}/{parameter_name}`
- Example: `/wyatt-personal-aws/dev/api_gateway_url`

## Frontend Deployment

### Deployment Script

The `deploy-frontend.sh` script provides a robust deployment solution:

```bash
# Deploy with auto-detected environment
./scripts/deploy-frontend.sh

# Deploy to specific environment
./scripts/deploy-frontend.sh --env prod

# Deploy React app instead of Next.js
./scripts/deploy-frontend.sh --env dev --app react

# Dry run
./scripts/deploy-frontend.sh --env prod --dry-run
```

### Features

1. **Environment Detection**
   - Automatically detects environment from Terraform workspace or Git branch
   - Can be overridden with `--env` flag

2. **SSM Parameter Integration**
   - Fetches configuration from SSM Parameter Store
   - Validates all required parameters exist
   - Creates proper environment files (.env.production)

3. **Rollback Capabilities**
   - Creates deployment backups before each deployment
   - Maintains rollback history (last 5 deployments)
   - Easy rollback with deployment ID

4. **Health Checks**
   - Performs post-deployment health checks
   - Suggests rollback command if health check fails

### Rollback Operations

```bash
# List available rollback points
./scripts/deploy-frontend.sh --list

# Rollback to specific deployment
./scripts/deploy-frontend.sh --env prod --app nextjs --rollback 20240118_143022
```

## Workflow Integration

### Initial Setup

1. Deploy infrastructure with Terraform:
   ```bash
   cd main
   terraform workspace select dev
   terraform apply
   ```

2. Sync outputs to SSM:
   ```bash
   ./scripts/sync-terraform-outputs-to-ssm.sh
   ```

3. Deploy frontend:
   ```bash
   ./scripts/deploy-frontend.sh --env dev
   ```

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
steps:
  - name: Terraform Apply
    run: |
      cd main
      terraform apply -auto-approve

  - name: Sync to SSM
    run: |
      ./scripts/sync-terraform-outputs-to-ssm.sh

  - name: Deploy Frontend
    run: |
      ./scripts/deploy-frontend.sh --env ${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
```

## Required SSM Parameters

### Next.js Application
- `api_gateway_url`: API Gateway endpoint URL
- `cognito_user_pool_id`: Cognito User Pool ID
- `cognito_client_id`: Cognito App Client ID
- `websocket_api_url`: WebSocket API URL (optional)

### React Application
All of the above plus:
- `s3_static_bucket`: S3 bucket for static hosting
- `cloudfront_distribution_url`: CloudFront distribution URL
- `cloudfront_distribution_id`: CloudFront distribution ID

## Security Considerations

1. **IAM Permissions**
   - Ensure deployment role has SSM:GetParametersByPath permission
   - Restrict SSM parameter access by path prefix
   - Use SecureString type for sensitive values

2. **Parameter Access**
   - Parameters are scoped by environment
   - No cross-environment access by default
   - Audit trail via CloudTrail

## Error Handling

1. **Missing Parameters**
   - Script validates all required parameters exist
   - Clear error messages for missing parameters
   - Suggests checking Terraform outputs

2. **Build Failures**
   - Preserves existing deployment on build failure
   - No partial deployments
   - Clear error messages

3. **Deployment Failures**
   - Automatic rollback suggestions
   - Preserved deployment history
   - Health check validation

## Best Practices

1. **Always sync SSM after Terraform changes**
   ```bash
   terraform apply && ./scripts/sync-terraform-outputs-to-ssm.sh
   ```

2. **Use dry-run for testing**
   ```bash
   ./scripts/deploy-frontend.sh --env prod --dry-run
   ```

3. **Monitor deployment health**
   - Check health check results
   - Review CloudWatch logs
   - Monitor application metrics

4. **Regular rollback cleanup**
   - Script automatically maintains last 5 deployments
   - Manual cleanup if needed:
     ```bash
     rm -rf ~/.frontend-deployments/old-deployments
     ```

## Troubleshooting

### Common Issues

1. **SSM Parameters Not Found**
   - Check parameter path: `aws ssm get-parameters-by-path --path "/wyatt-personal-aws/dev/"`
   - Verify sync script ran successfully
   - Check AWS region configuration

2. **Build Failures**
   - Check Node.js version compatibility
   - Clear npm cache: `npm cache clean --force`
   - Remove node_modules and reinstall

3. **Deployment Fails Health Check**
   - Check CloudFront distribution status
   - Verify S3 bucket permissions
   - Check API Gateway configuration

### Debug Mode

Enable verbose output for debugging:
```bash
bash -x ./scripts/deploy-frontend.sh --env dev
```

## Future Enhancements

1. **Parameter Encryption**
   - Add support for SecureString parameters
   - Implement KMS key rotation

2. **Multi-Region Support**
   - Cross-region parameter replication
   - Regional failover capabilities

3. **Advanced Health Checks**
   - Custom health check endpoints
   - Performance threshold validation
   - Dependency health verification

4. **Deployment Strategies**
   - Blue/green deployments
   - Canary deployments
   - Feature flag integration
