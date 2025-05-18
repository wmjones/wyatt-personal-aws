# TFVars vs Terraform Cloud Variables Audit

## Current State Analysis

### Variables Defined in TFVars Files

Both `dev.tfvars` and `prod.tfvars` define the following variables:

1. **Basic Information**
   - `environment` - "dev" or "prod"
   - `aws_region` - "us-east-2" (same for both)
   - `project_name` - "wyatt-personal-aws" (same for both)
   - `domain_name` - "example.com" (placeholder in both)
   - `app_prefix` - "app-dev" (dev) or "app" (prod)
   - `cognito_domain_prefix` - "wyatt-personal-dev" (dev) or "wyatt-personal-aws" (prod)

2. **Network Configuration**
   - `vpc_cidr` - "10.0.0.0/16" (same for both)
   - `single_nat_gateway` - true (dev) or false (prod)
   - `one_nat_gateway_per_az` - false (dev) or true (prod)
   - `create_interface_endpoints` - false (dev) or true (prod)

3. **Cognito Configuration**
   - `cognito_deletion_protection` - false (dev) or true (prod)

4. **DynamoDB Configuration**
   - `dynamodb_billing_mode` - "PAY_PER_REQUEST" (same for both)
   - `dynamodb_point_in_time_recovery` - false (dev) or true (prod)

5. **Other Service Configurations**
   - `lambda_runtime` - "python3.10" (same for both)
   - `websocket_api_name` - environment-specific names
   - `step_function_name` - environment-specific names
   - `vercel_app_url` - empty placeholder (same for both)

6. **Security Group Names**
   - All security group names are environment-specific

7. **EventBridge Configuration**
   - `eventbridge_rule_name` - environment-specific names

### GitHub Actions Environment Variables

From `terraform_apply.yml`:
- `TF_CLOUD_ORGANIZATION`: "wyatt-personal-aws"
- `TF_API_TOKEN`: from secrets
- `TODOIST_API_SECRET`: from secrets
- `NOTION_API_SECRET`: from secrets
- `TF_WORKSPACE`: dynamically set based on branch

## Recommendations

### 1. Variables to Keep in TFVars
These should remain in environment-specific tfvars files as they differ between environments:
- `environment`
- `app_prefix`
- `cognito_domain_prefix`
- `single_nat_gateway`
- `one_nat_gateway_per_az`
- `create_interface_endpoints`
- `cognito_deletion_protection`
- `dynamodb_point_in_time_recovery`
- All environment-specific resource names

### 2. Variables to Move to Terraform Cloud Workspace Variables
These could be moved to workspace variables for better security and centralization:
- API keys and secrets (already in GitHub secrets, should be workspace variables)
- `domain_name` (once actual domain is set)
- `vercel_app_url` (once integrated)

### 3. Variables to Keep as Defaults in Terraform
These are the same across environments and could be defaults:
- `aws_region` (if always us-east-2)
- `project_name`
- `vpc_cidr` (if always same)
- `dynamodb_billing_mode` (if always PAY_PER_REQUEST)
- `lambda_runtime` (if always python3.10)

## Variable Precedence Strategy

1. **Command Line**: `-var` flags (highest precedence)
2. **Environment Variables**: `TF_VAR_*`
3. **Terraform Cloud Workspace Variables**
4. **terraform.tfvars file**
5. **environment-specific.tfvars files**
6. **Variable Defaults** (lowest precedence)

## Action Items

1. Remove redundant variables that are the same across environments
2. Move sensitive variables to Terraform Cloud workspace variables
3. Document which variables are managed where
4. Update deployment scripts to handle the new variable structure
5. Create a validation script to ensure consistency

## Security Considerations

- Never commit sensitive values to git
- Use Terraform Cloud workspace variables for secrets
- Rotate credentials regularly
- Use least privilege IAM roles
