#!/bin/bash

# Script to fix the OIDC provider issue by importing the existing resource

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    echo -e "${GREEN}OIDC provider exists. Importing into Terraform state...${NC}"

    # Import the existing OIDC provider
    cd main
    terraform init

    # Import for both workspaces if they exist
    for workspace in wyatt-personal-aws-dev wyatt-personal-aws-prod; do
        echo -e "${YELLOW}Checking workspace: $workspace${NC}"
        if terraform workspace list | grep -q "$workspace"; then
            terraform workspace select "$workspace"
            echo -e "${YELLOW}Importing OIDC provider into $workspace workspace...${NC}"
            terraform import aws_iam_openid_connect_provider.github_actions "$OIDC_ARN" || echo -e "${YELLOW}Already imported or import failed for $workspace${NC}"
        fi
    done

    echo -e "${GREEN}Import complete. You can now run terraform plan/apply.${NC}"
else
    echo -e "${YELLOW}OIDC provider does not exist. It will be created on next terraform apply.${NC}"
fi
