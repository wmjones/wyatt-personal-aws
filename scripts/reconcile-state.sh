#!/bin/bash
# State reconciliation script for resolving Terraform state drift
# Usage: ./reconcile-state.sh [environment]

set -e

# Set color outputs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to prod if not specified (since that's where the drift is)
ENV=${1:-prod}

# Map environment to workspace
declare -A WORKSPACE_MAP=(
  ["dev"]="wyatt-personal-aws-dev"
  ["prod"]="wyatt-personal-aws-prod"
)

WORKSPACE="${WORKSPACE_MAP[$ENV]}"

echo -e "${BLUE}State Reconciliation Script${NC}"
echo -e "${YELLOW}Environment: $ENV${NC}"
echo -e "${YELLOW}Workspace: $WORKSPACE${NC}"
echo ""

# Change to terraform directory
cd /workspaces/wyatt-personal-aws/main

# Set workspace
export TF_WORKSPACE=$WORKSPACE

# Initialize terraform
echo -e "${YELLOW}Initializing Terraform...${NC}"
terraform init

# Select workspace
echo -e "${YELLOW}Selecting workspace...${NC}"
terraform workspace select $WORKSPACE || {
    echo -e "${RED}Failed to select workspace $WORKSPACE${NC}"
    exit 1
}

# Function to safely import a resource
safe_import() {
    local resource_type=$1
    local resource_id=$2
    local resource_name=$3

    echo -e "${YELLOW}Checking $resource_name...${NC}"

    # Check if resource already in state
    if terraform state show "$resource_type" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ $resource_name already in state${NC}"
        return 0
    fi

    # Check if resource exists in AWS
    echo -e "${YELLOW}Resource not in state, checking AWS...${NC}"

    # Import the resource
    echo -e "${YELLOW}Importing $resource_name...${NC}"
    if terraform import "$resource_type" "$resource_id"; then
        echo -e "${GREEN}✓ Successfully imported $resource_name${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to import $resource_name${NC}"
        return 1
    fi
}

# Reconciliation for production workspace
if [ "$ENV" == "prod" ]; then
    echo -e "${BLUE}Starting production state reconciliation...${NC}"
    echo ""

    # IAM Roles
    echo -e "${BLUE}=== IAM Roles ===${NC}"
    safe_import "module.notion_lambda.module.lambda_function.aws_iam_role.lambda[0]" "notion_lambda" "Notion Lambda Role"
    safe_import "module.todoist_lambda.module.lambda_function.aws_iam_role.lambda[0]" "todoist_lambda" "Todoist Lambda Role"
    safe_import "module.chatgpt_lambda.module.lambda_function.aws_iam_role.lambda[0]" "ChatGPT_lambda" "ChatGPT Lambda Role"
    safe_import "module.get_visualization_data.module.lambda_function.aws_iam_role.lambda[0]" "get_visualization_data" "Get Visualization Data Role"
    safe_import "module.put_todoist_lambda.module.lambda_function.aws_iam_role.lambda[0]" "put_todoist_lambda" "Put Todoist Lambda Role"
    safe_import "module.put_visualization_data.module.lambda_function.aws_iam_role.lambda[0]" "put_visualization_data" "Put Visualization Data Role"
    echo ""

    # CloudWatch Log Groups
    echo -e "${BLUE}=== CloudWatch Log Groups ===${NC}"
    safe_import "module.chatgpt_lambda.module.lambda_function.aws_cloudwatch_log_group.lambda[0]" "/aws/lambda/ChatGPT_lambda" "ChatGPT Lambda Log Group"
    safe_import "module.todoist_lambda.module.lambda_function.aws_cloudwatch_log_group.lambda[0]" "/aws/lambda/todoist_lambda" "Todoist Lambda Log Group"
    safe_import "module.get_visualization_data.module.lambda_function.aws_cloudwatch_log_group.lambda[0]" "/aws/lambda/get_visualization_data" "Get Visualization Data Log Group"
    safe_import "module.notion_lambda.module.lambda_function.aws_cloudwatch_log_group.lambda[0]" "/aws/lambda/notion_lambda" "Notion Lambda Log Group"
    safe_import "module.put_visualization_data.module.lambda_function.aws_cloudwatch_log_group.lambda[0]" "/aws/lambda/put_visualization_data" "Put Visualization Data Log Group"
    safe_import "module.put_todoist_lambda.module.lambda_function.aws_cloudwatch_log_group.lambda[0]" "/aws/lambda/put_todoist_lambda" "Put Todoist Lambda Log Group"
    safe_import "module.api_gateway.aws_cloudwatch_log_group.api_gw[0]" "/aws/apigateway/dashboard-api" "API Gateway Log Group"
    echo ""

    # S3 Buckets
    echo -e "${BLUE}=== S3 Buckets ===${NC}"
    safe_import "aws_s3_bucket.wyatt-datalake-35315550" "step-function-bucket-35315550" "Step Function Bucket"
    echo ""

    # IAM Policies - Need to get ARNs first
    echo -e "${BLUE}=== IAM Policies ===${NC}"
    echo -e "${YELLOW}Getting IAM policy ARNs...${NC}"

    # Get put_visualization_data-inline policy ARN
    PUT_VIS_POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='put_visualization_data-inline'].Arn" --output text)
    if [ -n "$PUT_VIS_POLICY_ARN" ]; then
        safe_import "module.put_visualization_data.module.lambda_function.aws_iam_policy.additional_inline[0]" "$PUT_VIS_POLICY_ARN" "Put Visualization Data Inline Policy"
    else
        echo -e "${YELLOW}⚠ put_visualization_data-inline policy not found${NC}"
    fi

    # Get get_visualization_data-inline policy ARN
    GET_VIS_POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='get_visualization_data-inline'].Arn" --output text)
    if [ -n "$GET_VIS_POLICY_ARN" ]; then
        safe_import "module.get_visualization_data.module.lambda_function.aws_iam_policy.additional_inline[0]" "$GET_VIS_POLICY_ARN" "Get Visualization Data Inline Policy"
    else
        echo -e "${YELLOW}⚠ get_visualization_data-inline policy not found${NC}"
    fi
    echo ""
fi

# Verify state after reconciliation
echo -e "${BLUE}=== State Verification ===${NC}"
echo -e "${YELLOW}Running terraform plan to verify state...${NC}"

# Create a plan to see if there are any remaining issues
terraform plan -var-file=environments/$ENV.tfvars -out=/tmp/reconcile-plan.tfplan

# Check if plan shows any errors
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ State reconciliation successful!${NC}"
    echo -e "${YELLOW}Review the plan output above to confirm all resources are correctly tracked.${NC}"
else
    echo -e "${RED}✗ There are still issues after reconciliation${NC}"
    echo -e "${YELLOW}Review the errors above and manual intervention may be required.${NC}"
fi

# Cleanup
rm -f /tmp/reconcile-plan.tfplan

echo ""
echo -e "${BLUE}Reconciliation complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the terraform plan output"
echo "2. If everything looks good, run: terraform apply -var-file=environments/$ENV.tfvars"
echo "3. Monitor for any remaining drift issues"
