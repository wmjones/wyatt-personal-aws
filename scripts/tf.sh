#!/bin/bash
#
# Terraform wrapper script for environment-specific operations
# Usage: ./scripts/tf.sh <action> <environment>
#
# Examples:
#   ./scripts/tf.sh plan dev
#   ./scripts/tf.sh destroy prod
#

set -e

# Default environment is dev if not specified
ENV=${2:-dev}
ACTION=$1
PROJECT_ROOT=$(git rev-parse --show-toplevel)

# Validate environment
if [[ ! "$ENV" =~ ^(dev|prod)$ ]]; then
  echo "Error: Environment must be one of: dev, prod"
  exit 1
fi

# Validate action is provided
if [ -z "$ACTION" ]; then
  echo "Error: Action is required"
  echo "Usage: $0 <action> <environment>"
  echo "Example: $0 plan dev"
  exit 1
fi

# Change to the main Terraform directory
cd "$PROJECT_ROOT/main"

# Set color outputs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running terraform $ACTION for $ENV environment${NC}"

# Special handling for init
if [ "$ACTION" == "init" ]; then
  echo -e "${YELLOW}Initializing Terraform...${NC}"
  terraform init
  exit $?
fi

# Path to the var file
VAR_FILE="$PROJECT_ROOT/environments/$ENV/terraform.tfvars"

# Check if var file exists
if [ ! -f "$VAR_FILE" ]; then
  echo -e "${RED}Error: Var file not found: $VAR_FILE${NC}"
  exit 1
fi

# Handle different actions
case "$ACTION" in
  plan)
    echo -e "${YELLOW}Planning deployment for $ENV environment...${NC}"
    terraform plan -var-file="$VAR_FILE" -out="$PROJECT_ROOT/environments/$ENV/tfplan"
    ;;
  apply)
    # Check if we have a plan file
    PLAN_FILE="$PROJECT_ROOT/environments/$ENV/tfplan"
    if [ -f "$PLAN_FILE" ]; then
      echo -e "${YELLOW}Applying plan for $ENV environment...${NC}"
      terraform apply "$PLAN_FILE"
      # Remove plan file after apply
      rm "$PLAN_FILE"
    else
      echo -e "${YELLOW}No plan file found, applying directly with var file...${NC}"
      terraform apply -var-file="$VAR_FILE"
    fi
    ;;
  destroy)
    echo -e "${RED}WARNING: You are about to destroy the $ENV environment!${NC}"
    read -p "Are you sure you want to continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      terraform destroy -var-file="$VAR_FILE"
    else
      echo -e "${GREEN}Destroy cancelled.${NC}"
      exit 0
    fi
    ;;
  output)
    terraform output -var-file="$VAR_FILE"
    ;;
  validate)
    terraform validate
    ;;
  fmt)
    terraform fmt -recursive
    ;;
  *)
    # For any other actions, just pass through with the var file
    terraform $ACTION -var-file="$VAR_FILE"
    ;;
esac

exit $?
