#!/bin/bash

# Script to fix the OIDC provider issue by importing the existing resource

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}Error: Failed to get AWS account ID. Make sure AWS credentials are configured.${NC}"
    exit 1
fi

echo -e "${GREEN}AWS Account ID: $ACCOUNT_ID${NC}"

# Check if OIDC provider exists
OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

echo -e "${YELLOW}Checking if OIDC provider exists...${NC}"
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$OIDC_ARN" &>/dev/null; then
    echo -e "${GREEN}✓ OIDC provider exists in AWS account${NC}"

    # Change to main directory
    cd main

    # Initialize Terraform
    echo -e "${BLUE}Initializing Terraform...${NC}"
    terraform init -reconfigure

    # Import for both workspaces
    for workspace in wyatt-personal-aws-dev wyatt-personal-aws-prod; do
        echo -e "${YELLOW}Processing workspace: $workspace${NC}"

        # Select the workspace
        terraform workspace select "$workspace" || {
            echo -e "${YELLOW}Workspace $workspace doesn't exist, creating it...${NC}"
            terraform workspace new "$workspace"
        }

        # Check if already imported
        if terraform state show aws_iam_openid_connect_provider.github_actions &>/dev/null; then
            echo -e "${GREEN}✓ OIDC provider already imported in workspace $workspace${NC}"
        else
            echo -e "${BLUE}Importing OIDC provider for workspace: $workspace${NC}"
            terraform import aws_iam_openid_connect_provider.github_actions "$OIDC_ARN"
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Successfully imported OIDC provider${NC}"
            else
                echo -e "${RED}✗ Failed to import OIDC provider${NC}"
                exit 1
            fi
        fi
    done

    echo -e "${GREEN}✓ Import process complete. You can now run terraform plan/apply.${NC}"
    echo -e "${BLUE}Tip: Run 'cd main && terraform plan' to verify the import worked correctly.${NC}"
else
    echo -e "${YELLOW}OIDC provider does not exist. It will be created on next terraform apply.${NC}"
fi
