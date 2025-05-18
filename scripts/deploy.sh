#!/bin/bash
# Deployment script for Terraform Cloud workspace deployments
# Supports CI/CD pipelines and interactive use
# Usage: ./deploy.sh <environment> [action]
# Examples:
#   ./deploy.sh dev
#   ./deploy.sh prod plan
#   ./deploy.sh dev apply

# Set color outputs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if environment argument is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: Environment argument is required${NC}"
    echo "Usage: $0 <environment> [action]"
    echo "Example: $0 dev [plan|apply]"
    exit 1
fi

# Parse arguments
ENV=$1
ACTION=${2:-"interactive"}  # Default to interactive mode if no action specified

# Map environment to Terraform Cloud workspace
declare -A WORKSPACE_MAP=(
  ["dev"]="wyatt-personal-aws-dev"
  ["prod"]="wyatt-personal-aws-prod"
)

# Validate environment
if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    echo -e "${RED}Error: Invalid environment. Please use 'dev' or 'prod'.${NC}"
    exit 1
fi

# Set workspace
TF_WORKSPACE="${WORKSPACE_MAP[$ENV]}"
export TF_WORKSPACE

echo -e "${BLUE}Deploying to environment: $ENV${NC}"
echo -e "${BLUE}Terraform Cloud workspace: $TF_WORKSPACE${NC}"

# Set CI mode based on environment variable or second parameter
CI_MODE=false
if [ -n "$CI" ] || [ "$ACTION" == "plan" ] || [ "$ACTION" == "apply" ]; then
    CI_MODE=true
fi

# Change to main directory
cd main/

# Path to environment var file
VAR_FILE="environments/$ENV.tfvars"

# Check if var file exists
if [ ! -f "$VAR_FILE" ]; then
    echo -e "${RED}Error: Environment file not found: $VAR_FILE${NC}"
    exit 1
fi

# Initialize Terraform if needed
if [ "$ACTION" != "apply" ] || [ "$CI_MODE" == false ]; then
    echo -e "${YELLOW}Initializing Terraform...${NC}"
    terraform init

    # Select workspace after init
    echo -e "${YELLOW}Selecting workspace $TF_WORKSPACE...${NC}"
    terraform workspace select "$TF_WORKSPACE" || {
        echo -e "${YELLOW}Workspace doesn't exist, creating it...${NC}"
        terraform workspace new "$TF_WORKSPACE"
    }
fi

# Handle action based on mode and parameters
if [ "$ACTION" == "plan" ]; then
    # Just run plan without storing the plan file
    echo -e "${YELLOW}Planning deployment for $ENV environment...${NC}"
    terraform plan -var-file=$VAR_FILE
    exit $?
elif [ "$ACTION" == "apply" ]; then
    # Add extra confirmation for production in CI mode
    if [ "$ENV" == "prod" ] && [ -z "$SKIP_PROD_CONFIRM" ]; then
        echo -e "${RED}WARNING: You are about to deploy to PRODUCTION!${NC}"
        echo -e "${RED}Workspace: $TF_WORKSPACE${NC}"
        echo "To proceed, set SKIP_PROD_CONFIRM=true or run interactively"
        exit 1
    fi

    # Apply without confirmation in CI mode
    echo -e "${YELLOW}Applying deployment for $ENV environment...${NC}"
    terraform apply -auto-approve -var-file=$VAR_FILE
    exit $?
elif [ "$CI_MODE" == false ]; then
    # Interactive mode - show plan and prompt for confirmation
    echo -e "${YELLOW}Planning deployment for $ENV environment...${NC}"

    # Create plans directory if it doesn't exist
    mkdir -p plans/

    terraform plan -var-file=$VAR_FILE -out=plans/$ENV.tfplan

    # Extra confirmation for production
    if [ "$ENV" == "prod" ]; then
        echo -e "${RED}WARNING: This is a PRODUCTION deployment!${NC}"
        echo -e "${RED}Workspace: $TF_WORKSPACE${NC}"
        read -p "Type 'yes' to continue with production deployment: " prod_confirm
        if [ "$prod_confirm" != "yes" ]; then
            echo -e "${YELLOW}Production deployment canceled.${NC}"
            rm -f plans/$ENV.tfplan
            exit 0
        fi
    else
        # Standard confirmation for non-production
        read -p "Do you want to apply the above plan? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo -e "${YELLOW}Deployment canceled.${NC}"
            rm -f plans/$ENV.tfplan
            exit 0
        fi
    fi

    # Apply the deployment
    echo -e "${YELLOW}Applying deployment for $ENV environment...${NC}"
    terraform apply plans/$ENV.tfplan

    # Clean up
    rm -f plans/$ENV.tfplan

    echo -e "${GREEN}Deployment to $ENV environment completed.${NC}"
    echo -e "${BLUE}Workspace: $TF_WORKSPACE${NC}"
fi

exit 0
