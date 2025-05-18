#!/bin/bash

##############################################################################
# Script: sync-terraform-outputs-to-ssm.sh
# Description: Syncs Terraform outputs to AWS SSM Parameter Store
# Usage: ./sync-terraform-outputs-to-ssm.sh [--workspace <workspace>]
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
WORKSPACE=""
TERRAFORM_DIR="main"
PROJECT_NAME="wyatt-personal-aws"
AWS_REGION="${AWS_REGION:-us-east-1}"

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
    echo "Usage: $0 [--workspace <workspace>] [--dry-run]"
    echo "Options:"
    echo "  --workspace  Terraform workspace (default: current workspace)"
    echo "  --dry-run    Show what would be done without making changes"
    echo "  --help       Show this help message"
    exit 0
}

# Parse command line arguments
DRY_RUN=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --workspace)
            WORKSPACE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify required commands
for cmd in terraform aws jq; do
    if ! command_exists "$cmd"; then
        error_exit "$cmd is required but not installed."
    fi
done

# Change to terraform directory
cd "$TERRAFORM_DIR" || error_exit "Failed to change to terraform directory: $TERRAFORM_DIR"

# Get current workspace if not specified
if [ -z "$WORKSPACE" ]; then
    WORKSPACE=$(terraform workspace show) || error_exit "Failed to get current terraform workspace"
fi

print $BLUE "Using workspace: $WORKSPACE"

# Switch to the specified workspace
terraform workspace select "$WORKSPACE" || error_exit "Failed to select workspace: $WORKSPACE"

# Get terraform outputs in JSON format
print $BLUE "Getting Terraform outputs..."
OUTPUTS=$(terraform output -json) || error_exit "Failed to get terraform outputs"

# Check if outputs are empty
if [ -z "$OUTPUTS" ] || [ "$OUTPUTS" = "{}" ]; then
    print $YELLOW "No Terraform outputs found. Exiting."
    exit 0
fi

# Function to create/update SSM parameter
update_ssm_parameter() {
    local param_name=$1
    local param_value=$2
    local environment=$3

    # Skip if value is null or empty
    if [ -z "$param_value" ] || [ "$param_value" = "null" ]; then
        print $YELLOW "Skipping $param_name - empty value"
        return
    fi

    # Construct full parameter path
    local full_path="/${PROJECT_NAME}/${environment}/${param_name}"

    if [ "$DRY_RUN" = true ]; then
        print $BLUE "[DRY RUN] Would update: $full_path = $param_value"
        return
    fi

    # Check if parameter exists
    if aws ssm get-parameter --name "$full_path" --region "$AWS_REGION" >/dev/null 2>&1; then
        # Update existing parameter
        print $YELLOW "Updating existing parameter: $full_path"
        aws ssm put-parameter \
            --name "$full_path" \
            --value "$param_value" \
            --type "String" \
            --overwrite \
            --region "$AWS_REGION" \
            --tags "Key=Environment,Value=$environment" \
                   "Key=Project,Value=$PROJECT_NAME" \
                   "Key=ManagedBy,Value=Terraform" \
                   "Key=Purpose,Value=Configuration" \
            >/dev/null || error_exit "Failed to update parameter: $full_path"
    else
        # Create new parameter
        print $GREEN "Creating new parameter: $full_path"
        aws ssm put-parameter \
            --name "$full_path" \
            --value "$param_value" \
            --type "String" \
            --region "$AWS_REGION" \
            --tags "Key=Environment,Value=$environment" \
                   "Key=Project,Value=$PROJECT_NAME" \
                   "Key=ManagedBy,Value=Terraform" \
                   "Key=Purpose,Value=Configuration" \
            >/dev/null || error_exit "Failed to create parameter: $full_path"
    fi

    print $GREEN "✓ Successfully updated: $full_path"
}

# Process each terraform output
print $BLUE "Processing Terraform outputs..."
echo "$OUTPUTS" | jq -r 'to_entries[] | "\(.key)=\(.value.value)"' | while IFS='=' read -r key value; do
    # Clean up value (remove quotes if present)
    value=$(echo "$value" | jq -r '.')

    # Update SSM parameter
    update_ssm_parameter "$key" "$value" "$WORKSPACE"
done

# Summary
print $GREEN "✅ Terraform outputs successfully synced to SSM Parameter Store!"
print $BLUE "Workspace: $WORKSPACE"
print $BLUE "Region: $AWS_REGION"

# List all parameters for this environment
if [ "$DRY_RUN" = false ]; then
    print $BLUE "\nCurrent SSM parameters for $WORKSPACE environment:"
    aws ssm get-parameters-by-path \
        --path "/${PROJECT_NAME}/${WORKSPACE}/" \
        --region "$AWS_REGION" \
        --query 'Parameters[*].[Name, Value]' \
        --output table
fi
