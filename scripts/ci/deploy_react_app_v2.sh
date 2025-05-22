#!/bin/bash
set -e

##############################################################################
# Script: deploy_react_app_v2.sh
# Description: Updated CI deployment script that uses the new SSM workflow
# Usage: ./deploy_react_app_v2.sh [dev|prod]
##############################################################################

# Configuration variables
ENVIRONMENT=${1:-dev}  # Default to dev if not specified
APP_TYPE="react"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Deploying React app to $ENVIRONMENT environment using new SSM workflow..."

# Change to project root
cd "$PROJECT_ROOT"

# Use the new deployment script
./scripts/deploy-frontend.sh --env "$ENVIRONMENT" --app "$APP_TYPE"

echo "Deployment completed successfully!"
