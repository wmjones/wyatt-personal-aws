#!/bin/bash

##############################################################################
# Script: full-deployment.sh
# Description: Complete deployment workflow including Terraform, SSM sync,
#              and frontend deployment
# Usage: ./full-deployment.sh [--env <environment>] [--skip-terraform]
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
SKIP_TERRAFORM=false
TERRAFORM_DIR="main"

# Function to print colored output
print() {
    local color=$1
    shift
    echo -e "${color}$*${NC}"
}

# Function to print error messages and exit
error_exit() {
    print $RED "ERROR: $1"
    exit 1
}

# Function to print usage
usage() {
    echo "Usage: $0 [--env <environment>] [--skip-terraform] [--help]"
    echo "Options:"
    echo "  --env           Environment (dev|prod)"
    echo "  --skip-terraform Skip Terraform apply step"
    echo "  --help          Show this help message"
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-terraform)
            SKIP_TERRAFORM=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            error_exit "Unknown option: $1"
            ;;
    esac
done

# Validate environment
if [ -z "$ENVIRONMENT" ]; then
    error_exit "Environment is required. Use --env dev or --env prod"
fi

if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
    error_exit "Invalid environment: $ENVIRONMENT. Must be 'dev' or 'prod'"
fi

print $GREEN "🚀 Starting full deployment workflow for environment: $ENVIRONMENT"

# Step 1: Terraform Apply
if [ "$SKIP_TERRAFORM" = false ]; then
    print $BLUE "\n📦 Step 1: Applying Terraform changes..."
    cd "$TERRAFORM_DIR" || error_exit "Failed to change to terraform directory"

    # Select workspace
    terraform workspace select "$ENVIRONMENT" || error_exit "Failed to select workspace: $ENVIRONMENT"

    # Apply terraform
    print $BLUE "Running terraform apply..."
    terraform apply -auto-approve || error_exit "Terraform apply failed"

    cd - > /dev/null
    print $GREEN "✓ Terraform apply completed successfully"
else
    print $YELLOW "\n⏩ Skipping Terraform apply"
fi

# Step 2: Sync SSM Parameters
print $BLUE "\n🔄 Step 2: Syncing Terraform outputs to SSM..."
./scripts/sync-terraform-outputs-to-ssm.sh --workspace "$ENVIRONMENT" || error_exit "SSM sync failed"
print $GREEN "✓ SSM parameters synced successfully"

# Step 3: Deploy Frontend
print $BLUE "\n🌐 Step 3: Deploying frontend application..."
./scripts/deploy-frontend.sh --env "$ENVIRONMENT" || error_exit "Frontend deployment failed"

# Summary
print $GREEN "\n✅ Full deployment completed successfully!"
print $BLUE "Environment: $ENVIRONMENT"
print $BLUE "Timestamp: $(date)"

# Show deployment info
print $BLUE "\nDeployment Information:"
print $BLUE "- Terraform workspace: $ENVIRONMENT"
print $BLUE "- SSM parameters prefix: /wyatt-personal-aws/$ENVIRONMENT/"
print $BLUE "- Frontend deployment: Check the deployment script output above"

# Next steps
print $YELLOW "\nNext steps:"
print $YELLOW "1. Verify the application is running correctly"
print $YELLOW "2. Check health endpoints and monitoring"
print $YELLOW "3. Review CloudWatch logs for any issues"
