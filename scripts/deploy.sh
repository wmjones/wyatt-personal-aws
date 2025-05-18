#!/bin/bash
# Deployment script for environment-specific deployments
# Supports CI/CD pipelines and interactive use
# Usage: ./deploy.sh <environment> [action]
# Examples:
#   ./deploy.sh dev
#   ./deploy.sh prod plan
#   ./deploy.sh dev apply

# Check if environment argument is provided
if [ $# -eq 0 ]; then
    echo "Error: Environment argument is required"
    echo "Usage: $0 <environment> [action]"
    echo "Example: $0 dev [plan|apply]"
    exit 1
fi

# Parse arguments
ENV=$1
ACTION=${2:-"interactive"}  # Default to interactive mode if no action specified

# Validate environment
if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    echo "Error: Invalid environment. Please use 'dev' or 'prod'."
    exit 1
fi

# Set CI mode based on environment variable or second parameter
CI_MODE=false
if [ -n "$CI" ] || [ "$ACTION" == "plan" ] || [ "$ACTION" == "apply" ]; then
    CI_MODE=true
fi

# Path to environment var file
VAR_FILE="environments/$ENV.tfvars"

# Check if var file exists
if [ ! -f "$VAR_FILE" ]; then
    echo "Error: Environment file not found: $VAR_FILE"
    exit 1
fi

# Initialize Terraform if needed
if [ "$ACTION" != "apply" ] || [ "$CI_MODE" == false ]; then
    echo "Initializing Terraform..."
    terraform init
fi

# Handle action based on mode and parameters
if [ "$ACTION" == "plan" ]; then
    # Just run plan without storing the plan file
    echo "Planning deployment for $ENV environment..."
    terraform plan -var-file=$VAR_FILE
    exit $?
elif [ "$ACTION" == "apply" ]; then
    # Apply without confirmation in CI mode
    echo "Applying deployment for $ENV environment..."
    terraform apply -auto-approve -var-file=$VAR_FILE
    exit $?
elif [ "$CI_MODE" == false ]; then
    # Interactive mode - show plan and prompt for confirmation
    echo "Planning deployment for $ENV environment..."
    terraform plan -var-file=$VAR_FILE -out=$ENV.tfplan

    # Confirm deployment in interactive mode
    read -p "Do you want to apply the above plan? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "Deployment canceled."
        rm -f $ENV.tfplan
        exit 0
    fi

    # Apply the deployment
    echo "Applying deployment for $ENV environment..."
    terraform apply $ENV.tfplan

    # Clean up
    rm -f $ENV.tfplan

    echo "Deployment to $ENV environment completed."
fi

exit 0
