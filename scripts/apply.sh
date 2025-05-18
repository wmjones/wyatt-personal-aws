#!/bin/bash
#
# Interactive wrapper for applying terraform with environment selection
# Uses the deploy.sh script for actual deployment
#

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Verify the deploy.sh script exists
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy.sh"
if [ ! -f "$DEPLOY_SCRIPT" ]; then
  echo "Error: Deployment script not found at $DEPLOY_SCRIPT"
  exit 1
fi

# Display available environments
echo "Available environments:"
echo "1. dev"
echo "2. prod"
echo ""

# Prompt for environment selection
read -p "Select environment (1-2): " ENV_CHOICE

# Convert choice to environment name
case "$ENV_CHOICE" in
  1)
    ENV="dev"
    ;;
  2)
    ENV="prod"
    ;;
  *)
    echo "Invalid selection. Defaulting to dev."
    ENV="dev"
    ;;
esac

# Confirmation for production
if [ "$ENV" == "prod" ]; then
  echo "WARNING: You are about to make changes to the PRODUCTION environment!"
  read -p "Are you sure you want to continue? (yes/no): " CONFIRM

  if [ "$CONFIRM" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
  fi
fi

# Run interactive deployment with selected environment
echo "Starting deployment for $ENV environment..."
"$DEPLOY_SCRIPT" "$ENV"
