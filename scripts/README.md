# Deployment Scripts

This directory contains scripts for managing deployments and other operational tasks.

## Scripts

### deploy.sh

Environment-specific deployment script that supports both interactive use and CI/CD pipelines.

**Usage:**
```bash
./deploy.sh <environment> [action]
```

**Parameters:**
- `environment`: Required. Either `dev` or `prod`
- `action`: Optional. Specifies the action to perform:
  - Default (no action): Interactive mode with confirmation
  - `plan`: Just run plan (non-interactive)
  - `apply`: Run apply (non-interactive)

**Examples:**
```bash
# Interactive deployment to development environment
./deploy.sh dev

# Interactive deployment to production environment
./deploy.sh prod

# Just run plan for development environment
./deploy.sh dev plan

# Deploy to production environment without confirmation (CI/CD)
./deploy.sh prod apply
```

**Environment Files:**
- Development: `/main/environments/dev.tfvars`
- Production: `/main/environments/prod.tfvars`

**Features:**
- Automatically switches between interactive and non-interactive modes
- Supports CI/CD workflows
- Validates environment and checks for presence of environment files
- Handles plan and apply operations

### tf.sh

Legacy Terraform wrapper script (deprecated - use deploy.sh instead).

### apply.sh

Alias for `deploy.sh` for backward compatibility.

### store-terraform-outputs.sh

Stores Terraform outputs as SSM parameters for use in CI/CD pipelines.

**Usage:**
```bash
./store-terraform-outputs.sh [environment]
```

**Parameters:**
- `environment`: Optional. Either `dev` or `prod`. Defaults to `dev` if not specified.

**Examples:**
```bash
# Store outputs for development environment
./store-terraform-outputs.sh dev

# Store outputs for production environment
./store-terraform-outputs.sh prod
```

**Features:**
- Retrieves Terraform outputs and stores them in SSM parameters
- Used by CI/CD pipelines to get configuration values
- Updates parameters when Terraform infrastructure changes

### verify-cognito-config.sh

Verifies the Cognito configuration by checking SSM parameters and AWS resources.

**Usage:**
```bash
./verify-cognito-config.sh [environment]
```

**Parameters:**
- `environment`: Optional. Either `dev` or `prod`. Defaults to `dev` if not specified.

**Examples:**
```bash
# Verify Cognito configuration for development environment
./verify-cognito-config.sh dev

# Verify Cognito configuration for production environment
./verify-cognito-config.sh prod
```

**Features:**
- Checks if SSM parameters for Cognito exist
- Verifies that the Cognito resources exist in AWS
- Provides troubleshooting information for authentication issues
- Suggests next steps if issues are found

### lint-and-tasks.sh

Runs linting tools and task management utilities for the codebase.

**Key Features:**
- Runs terraform fmt on all terraform files
- Detects current environment from git branch (main = prod, others = dev)
- Runs pre-commit checks in all environments
- Creates Task Master tasks from pre-commit issues (only in dev environment)
- Formats environment variable files
- Runs terraform plan with appropriate environment variables

**Usage:**
```bash
./lint-and-tasks.sh
```

You can also set the environment explicitly:
```bash
ENV=dev ./lint-and-tasks.sh
ENV=prod ./lint-and-tasks.sh
```

**Output:**
- Terraform formatting log
- Terraform plan results
- Pre-commit results (dev environment only)

## GitHub Actions Integration

The `deploy.sh` script is used in the GitHub Actions workflow to automate deployments:

- Workflow file: `/.github/workflows/terraform-deploy.yml`
- Branch-to-environment mapping:
  - `dev` branch → development environment
  - `main` branch → production environment
