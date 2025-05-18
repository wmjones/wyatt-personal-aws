# Production State Drift Analysis

## Overview

The production workspace (`wyatt-personal-aws-prod`) is experiencing significant state drift with multiple "resource already exists" errors during terraform apply. This document analyzes the issues and provides a resolution plan.

## Affected Resources

### IAM Roles
1. `notion_lambda` - EntityAlreadyExists
2. `todoist_lambda` - EntityAlreadyExists
3. `ChatGPT_lambda` - EntityAlreadyExists
4. `get_visualization_data` - EntityAlreadyExists
5. `put_todoist_lambda` - EntityAlreadyExists
6. `put_visualization_data` - EntityAlreadyExists

### CloudWatch Log Groups
1. `/aws/lambda/ChatGPT_lambda` - ResourceAlreadyExistsException
2. `/aws/lambda/todoist_lambda` - ResourceAlreadyExistsException
3. `/aws/lambda/get_visualization_data` - ResourceAlreadyExistsException
4. `/aws/lambda/notion_lambda` - ResourceAlreadyExistsException
5. `/aws/lambda/put_visualization_data` - ResourceAlreadyExistsException
6. `/aws/lambda/put_todoist_lambda` - ResourceAlreadyExistsException
7. `/aws/apigateway/dashboard-api` - ResourceAlreadyExistsException

### S3 Buckets
1. `step-function-bucket-35315550` - BucketAlreadyOwnedByYou

### IAM Policies
1. `put_visualization_data-inline` - EntityAlreadyExists
2. `get_visualization_data-inline` - EntityAlreadyExists

## Root Cause Analysis

The state drift appears to be caused by:

1. **Manual Resource Creation**: Resources were created outside of Terraform
2. **State File Corruption**: Terraform state lost track of existing resources
3. **Failed Deployments**: Previous apply operations partially completed
4. **Workspace Migration**: Issues during workspace setup or migration

## Resolution Plan

### Phase 1: Inventory and Verification

```bash
# 1. List current state
terraform state list

# 2. Check each affected resource in AWS
aws iam get-role --role-name notion_lambda
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/
aws s3api head-bucket --bucket step-function-bucket-35315550
aws iam get-policy --policy-arn <policy-arn>
```

### Phase 2: State Import

For each resource, import into Terraform state:

```bash
# IAM Roles
terraform import module.notion_lambda.module.lambda_function.aws_iam_role.lambda[0] notion_lambda
terraform import module.todoist_lambda.module.lambda_function.aws_iam_role.lambda[0] todoist_lambda
terraform import module.chatgpt_lambda.module.lambda_function.aws_iam_role.lambda[0] ChatGPT_lambda
terraform import module.get_visualization_data.module.lambda_function.aws_iam_role.lambda[0] get_visualization_data
terraform import module.put_todoist_lambda.module.lambda_function.aws_iam_role.lambda[0] put_todoist_lambda
terraform import module.put_visualization_data.module.lambda_function.aws_iam_role.lambda[0] put_visualization_data

# CloudWatch Log Groups
terraform import module.chatgpt_lambda.module.lambda_function.aws_cloudwatch_log_group.lambda[0] /aws/lambda/ChatGPT_lambda
terraform import module.todoist_lambda.module.lambda_function.aws_cloudwatch_log_group.lambda[0] /aws/lambda/todoist_lambda
terraform import module.get_visualization_data.module.lambda_function.aws_cloudwatch_log_group.lambda[0] /aws/lambda/get_visualization_data
terraform import module.notion_lambda.module.lambda_function.aws_cloudwatch_log_group.lambda[0] /aws/lambda/notion_lambda
terraform import module.put_visualization_data.module.lambda_function.aws_cloudwatch_log_group.lambda[0] /aws/lambda/put_visualization_data
terraform import module.put_todoist_lambda.module.lambda_function.aws_cloudwatch_log_group.lambda[0] /aws/lambda/put_todoist_lambda
terraform import module.api_gateway.aws_cloudwatch_log_group.api_gw[0] /aws/apigateway/dashboard-api

# S3 Bucket
terraform import aws_s3_bucket.wyatt-datalake-35315550 step-function-bucket-35315550

# IAM Policies (need to get ARNs first)
# Get policy ARN: aws iam list-policies --query "Policies[?PolicyName=='put_visualization_data-inline']"
terraform import module.put_visualization_data.module.lambda_function.aws_iam_policy.additional_inline[0] <policy-arn>
terraform import module.get_visualization_data.module.lambda_function.aws_iam_policy.additional_inline[0] <policy-arn>
```

### Phase 3: State Verification

After importing:

```bash
# Verify state
terraform plan

# Should show no changes if import was successful
# If changes are shown, review and adjust resource configurations
```

### Phase 4: Apply Required Changes

If configuration adjustments are needed:

```bash
# Apply any configuration changes
terraform apply

# Verify final state
terraform plan  # Should show no changes
```

## Prevention Strategy

### 1. Resource Tagging
Ensure all resources are tagged with:
- `ManagedBy = "Terraform"`
- `Workspace = "<workspace-name>"`
- `Environment = "<env>"`

### 2. Drift Detection Script

Create `scripts/detect-drift.sh`:

```bash
#!/bin/bash
# Detect state drift in current workspace

echo "Checking for state drift..."
terraform refresh
terraform plan -detailed-exitcode

if [ $? -eq 2 ]; then
  echo "Drift detected! Review plan output above."
  exit 1
else
  echo "No drift detected."
  exit 0
fi
```

### 3. Regular State Audits
- Weekly drift detection runs
- Monthly state backup
- Quarterly state cleanup

### 4. Import Guard Script

Create `scripts/safe-import.sh`:

```bash
#!/bin/bash
# Safe import with validation

RESOURCE_TYPE=$1
RESOURCE_ID=$2

# Check if resource exists in state
if terraform state show "$RESOURCE_TYPE" >/dev/null 2>&1; then
  echo "Resource already in state!"
  exit 1
fi

# Import resource
terraform import "$RESOURCE_TYPE" "$RESOURCE_ID"

# Verify import
terraform plan -target="$RESOURCE_TYPE"
```

## Action Items

1. **Immediate**: Import all drifted resources into state
2. **Short-term**: Implement drift detection in CI/CD
3. **Long-term**: Automate state reconciliation process

## Commands Reference

### Quick State Inspection
```bash
# Show all resources in state
terraform state list

# Show specific resource
terraform state show <resource>

# Remove resource from state (careful!)
terraform state rm <resource>

# Move resource in state
terraform state mv <old> <new>
```

### AWS CLI Verification
```bash
# List IAM roles
aws iam list-roles --query "Roles[?contains(RoleName, 'lambda')]"

# List log groups
aws logs describe-log-groups --query "logGroups[?contains(logGroupName, 'lambda')]"

# List S3 buckets
aws s3api list-buckets

# List IAM policies
aws iam list-policies --scope Local
```

## Support

For assistance with state drift issues:
1. Review this document
2. Check AWS Console for resource status
3. Verify workspace is correct
4. Contact DevOps team with specific errors
