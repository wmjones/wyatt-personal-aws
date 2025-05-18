#!/bin/bash
#
# Terraform wrapper script for Terraform Cloud workspace operations
# Usage: ./scripts/tf.sh <action> <environment>
#
# Examples:
#   ./scripts/tf.sh plan dev
#   ./scripts/tf.sh apply prod
#   ./scripts/tf.sh workspace-info
#
# The script handles workspace selection for Terraform Cloud:
# - dev environment -> wyatt-personal-aws-dev workspace
# - prod environment -> wyatt-personal-aws-prod workspace
#

set -e

# Default environment is dev if not specified
ENV=${2:-dev}
ACTION=$1
PROJECT_ROOT=$(git rev-parse --show-toplevel)

# Map environment to Terraform Cloud workspace
declare -A WORKSPACE_MAP=(
  ["dev"]="wyatt-personal-aws-dev"
  ["prod"]="wyatt-personal-aws-prod"
)

# Set color outputs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to get current workspace
get_current_workspace() {
  if [ -n "$TF_WORKSPACE" ]; then
    echo "$TF_WORKSPACE"
  else
    terraform workspace show 2>/dev/null || echo "default"
  fi
}

# Validate environment
if [[ ! "$ENV" =~ ^(dev|prod)$ ]]; then
  echo -e "${RED}Error: Environment must be one of: dev, prod${NC}"
  exit 1
fi

# Validate action is provided
if [ -z "$ACTION" ]; then
  echo -e "${RED}Error: Action is required${NC}"
  echo "Usage: $0 <action> <environment>"
  echo "Example: $0 plan dev"
  echo ""
  echo "Special actions:"
  echo "  workspace-info  - Show current workspace information"
  exit 1
fi

# Change to the main Terraform directory
cd "$PROJECT_ROOT/main"

# Handle workspace info action
if [ "$ACTION" == "workspace-info" ]; then
  echo -e "${BLUE}Current Workspace Information:${NC}"
  echo "TF_WORKSPACE env var: ${TF_WORKSPACE:-<not set>}"
  echo "Current workspace: $(get_current_workspace)"
  echo ""
  echo -e "${BLUE}Available workspaces:${NC}"
  for env in "${!WORKSPACE_MAP[@]}"; do
    echo "  $env -> ${WORKSPACE_MAP[$env]}"
  done
  exit 0
fi

# Set the workspace based on environment
DESIRED_WORKSPACE="${WORKSPACE_MAP[$ENV]}"

# Export TF_WORKSPACE for Terraform Cloud
export TF_WORKSPACE="$DESIRED_WORKSPACE"

echo -e "${YELLOW}Setting up Terraform Cloud workspace...${NC}"
echo -e "Environment: ${GREEN}$ENV${NC}"
echo -e "Workspace: ${GREEN}$DESIRED_WORKSPACE${NC}"

echo -e "${YELLOW}Running terraform $ACTION for $ENV environment${NC}"

# Special handling for init
if [ "$ACTION" == "init" ]; then
  echo -e "${YELLOW}Initializing Terraform with workspace $DESIRED_WORKSPACE...${NC}"
  terraform init

  # After init, select the appropriate workspace
  echo -e "${YELLOW}Selecting workspace $DESIRED_WORKSPACE...${NC}"
  terraform workspace select "$DESIRED_WORKSPACE" || {
    echo -e "${YELLOW}Workspace doesn't exist, creating it...${NC}"
    terraform workspace new "$DESIRED_WORKSPACE"
  }
  exit $?
fi

# Path to the var file
VAR_FILE="$PROJECT_ROOT/main/environments/$ENV.tfvars"

# Check if var file exists
if [ ! -f "$VAR_FILE" ]; then
  echo -e "${RED}Error: Var file not found: $VAR_FILE${NC}"
  exit 1
fi

# Verify we're on the correct workspace
CURRENT_WORKSPACE=$(get_current_workspace)
if [ "$CURRENT_WORKSPACE" != "$DESIRED_WORKSPACE" ] && [ "$CURRENT_WORKSPACE" != "default" ]; then
  echo -e "${YELLOW}Warning: Current workspace ($CURRENT_WORKSPACE) doesn't match desired workspace ($DESIRED_WORKSPACE)${NC}"
  echo -e "${YELLOW}Switching to $DESIRED_WORKSPACE...${NC}"
  terraform workspace select "$DESIRED_WORKSPACE" || {
    echo -e "${RED}Failed to switch to workspace $DESIRED_WORKSPACE${NC}"
    exit 1
  }
fi

# Handle different actions
case "$ACTION" in
  plan)
    echo -e "${YELLOW}Planning deployment for $ENV environment...${NC}"
    echo -e "${BLUE}Workspace: $DESIRED_WORKSPACE${NC}"
    terraform plan -var-file="$VAR_FILE" -out="$PROJECT_ROOT/main/plans/$ENV.tfplan"

    # Create plans directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/main/plans"

    echo -e "${GREEN}Plan saved to: $PROJECT_ROOT/main/plans/$ENV.tfplan${NC}"
    ;;
  apply)
    # Confirm production deployments
    if [ "$ENV" == "prod" ]; then
      echo -e "${RED}WARNING: You are about to apply changes to PRODUCTION!${NC}"
      echo -e "${RED}Workspace: $DESIRED_WORKSPACE${NC}"
      read -p "Type 'yes' to continue: " CONFIRM
      if [ "$CONFIRM" != "yes" ]; then
        echo -e "${YELLOW}Production deployment cancelled.${NC}"
        exit 0
      fi
    fi

    # Check if we have a plan file
    PLAN_FILE="$PROJECT_ROOT/main/plans/$ENV.tfplan"
    if [ -f "$PLAN_FILE" ]; then
      echo -e "${YELLOW}Applying saved plan for $ENV environment...${NC}"
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
    echo -e "${RED}Workspace: $DESIRED_WORKSPACE${NC}"
    read -p "Are you sure you want to continue? (yes/no) " CONFIRM
    if [ "$CONFIRM" == "yes" ]; then
      terraform destroy -var-file="$VAR_FILE"
    else
      echo -e "${GREEN}Destroy cancelled.${NC}"
      exit 0
    fi
    ;;
  output)
    terraform output
    ;;
  state)
    # Handle state commands with workspace awareness
    shift # Remove 'state' from arguments
    terraform state "$@"
    ;;
  workspace)
    # Show current workspace info
    echo -e "${BLUE}Current Terraform Cloud workspace:${NC}"
    terraform workspace show
    echo ""
    echo -e "${BLUE}Available workspaces:${NC}"
    terraform workspace list
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

# Show workspace info after action
echo -e "${BLUE}Completed in workspace: $(get_current_workspace)${NC}"

exit $?
