# Terraform Cloud Workspace Strategy

## Overview

This document describes the workspace strategy for managing infrastructure across development and production environments using Terraform Cloud.

## Workspace Architecture

### Workspace Names
- **Development**: `wyatt-personal-aws-dev`
- **Production**: `wyatt-personal-aws-prod`

### Workspace Selection Methods

1. **GitHub Actions (CI/CD)**
   - Automatically sets `TF_WORKSPACE` environment variable
   - `main` branch → `wyatt-personal-aws-prod`
   - `dev` branch → `wyatt-personal-aws-dev`

2. **Local Development**
   - Use the `tf.sh` script: `./scripts/tf.sh plan dev`
   - Or set environment variable: `export TF_WORKSPACE=wyatt-personal-aws-dev`

3. **Manual Selection**
   - `terraform workspace select wyatt-personal-aws-dev`

## Configuration Structure

### Variable Hierarchy

1. **Command Line** (`-var` flags) - Highest precedence
2. **Environment Variables** (`TF_VAR_*`)
3. **Terraform Cloud Workspace Variables**
4. **terraform.tfvars** files
5. **Variable Defaults** - Lowest precedence

### File Organization

```
main/
├── backend.tf              # Terraform Cloud backend configuration
├── workspace_validation.tf # Workspace validation logic
├── locals.tf              # Workspace-specific derived values
├── environments/
│   ├── dev.tfvars        # Development environment variables
│   ├── prod.tfvars       # Production environment variables
│   └── tfvars_audit.md   # Variable audit documentation
└── plans/                # Terraform plan files (gitignored)
```

## Usage Examples

### Development Deployment

```bash
# Interactive deployment
./scripts/deploy.sh dev

# Direct terraform commands
./scripts/tf.sh plan dev
./scripts/tf.sh apply dev

# Manual workspace management
export TF_WORKSPACE=wyatt-personal-aws-dev
terraform plan -var-file=environments/dev.tfvars
```

### Production Deployment

```bash
# Interactive deployment with extra confirmations
./scripts/deploy.sh prod

# CI/CD deployment (requires SKIP_PROD_CONFIRM=true)
./scripts/deploy.sh prod apply

# Direct terraform commands
./scripts/tf.sh plan prod
./scripts/tf.sh apply prod  # Requires 'yes' confirmation
```

### Workspace Information

```bash
# Show current workspace info
./scripts/tf.sh workspace-info

# Show terraform workspace
terraform workspace show

# List available workspaces
terraform workspace list
```

## Workspace-Specific Configuration

### Resource Naming
All resources include the environment in their name:
- Pattern: `${project_name}-${resource_type}-${environment}`
- Example: `wyatt-personal-aws-lambda-dev`

### Cost Optimization
- **Development**: Single NAT gateway, no interface endpoints
- **Production**: HA NAT gateways, interface endpoints enabled

### Security Settings
- **Development**: Deletion protection disabled
- **Production**: Deletion protection enabled, Point-in-time recovery

### Monitoring
- **Development**: Basic monitoring, 30-day log retention
- **Production**: Detailed monitoring, 90-day log retention

## Validation and Safeguards

### Workspace Validation
The `workspace_validation.tf` file ensures:
- Only valid workspaces are used
- Workspace matches environment variable
- Production deployments require explicit confirmation

### Script Safeguards
- Production deployments require typing 'yes'
- Color-coded output for clarity
- Workspace displayed before operations

## Troubleshooting

### Common Issues

1. **Wrong Workspace Selected**
   ```bash
   Error: Invalid workspace: default. Valid workspaces are: wyatt-personal-aws-dev, wyatt-personal-aws-prod
   ```
   **Solution**: Set `TF_WORKSPACE` or use `terraform workspace select`

2. **State Drift Errors**
   ```
   Error: creating IAM Role: EntityAlreadyExists
   ```
   **Solution**: See State Drift Resolution section

3. **Variable not Found**
   ```
   Error: No value for required variable
   ```
   **Solution**: Check tfvars file and Terraform Cloud variables

### State Drift Resolution

For resources that exist but aren't in state:
```bash
# Import existing resource
terraform import module.module_name.resource_type.name actual-resource-id

# Example: Import IAM role
terraform import module.lambda.aws_iam_role.lambda notion_lambda_role
```

### Debug Commands

```bash
# Check current workspace
echo $TF_WORKSPACE
terraform workspace show

# Validate configuration
terraform validate

# Check state
terraform state list
terraform state show <resource>

# Force refresh state
terraform refresh
```

## Best Practices

1. **Always verify workspace before operations**
   - Use `workspace-info` command
   - Check color-coded output

2. **Use appropriate scripts**
   - `deploy.sh` for deployments
   - `tf.sh` for direct terraform commands

3. **Document workspace changes**
   - Update this document
   - Note any special configurations

4. **Regular state verification**
   - Run `terraform plan` to check for drift
   - Address "resource already exists" errors

5. **Environment isolation**
   - Never share resources between environments
   - Use workspace-specific naming

## Migration Guide

### From Tag-Based to Explicit Workspaces

1. **Update backend.tf** ✓
2. **Add workspace validation** ✓
3. **Update deployment scripts** ✓
4. **Add workspace-specific logic** ✓
5. **Document changes** ✓

### Next Steps

1. Resolve production state drift issues
2. Implement state reconciliation scripts
3. Add automated drift detection
4. Create workspace-specific dashboards

## Support

For workspace-related issues:
1. Check this documentation
2. Review error messages carefully
3. Verify environment variables
4. Check Terraform Cloud console
5. Contact DevOps team if needed
