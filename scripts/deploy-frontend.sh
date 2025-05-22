#!/bin/bash

##############################################################################
# Script: deploy-frontend.sh
# Description: Robust frontend deployment script with environment detection,
#              SSM parameter integration, and rollback capabilities
# Usage: ./deploy-frontend.sh [--env <environment>] [--app <app>] [--dry-run]
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
APP_TYPE="nextjs"  # nextjs or react
PROJECT_NAME="wyatt-personal-aws"
AWS_REGION="${AWS_REGION:-us-east-1}"
DEPLOYMENT_ID=$(date +%Y%m%d_%H%M%S)
ROLLBACK_DIR="${HOME}/.frontend-deployments"
MAX_ROLLBACK_HISTORY=5

# App directories
NEXTJS_APP_DIR="src/frontend/nextjs-app"
REACT_APP_DIR="src/frontend/react-app"

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
    echo "Usage: $0 [--env <environment>] [--app <app>] [--dry-run] [--rollback <deployment-id>]"
    echo "Options:"
    echo "  --env        Environment (dev|prod) - auto-detected if not specified"
    echo "  --app        Application type (nextjs|react) - default: nextjs"
    echo "  --dry-run    Show what would be done without making changes"
    echo "  --rollback   Rollback to a specific deployment ID"
    echo "  --list       List available rollback points"
    echo "  --help       Show this help message"
    exit 0
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Parse command line arguments
DRY_RUN=false
ROLLBACK_ID=""
LIST_ROLLBACKS=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --app)
            APP_TYPE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --rollback)
            ROLLBACK_ID="$2"
            shift 2
            ;;
        --list)
            LIST_ROLLBACKS=true
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

# Verify required commands
for cmd in aws jq npm node; do
    if ! command_exists "$cmd"; then
        error_exit "$cmd is required but not installed."
    fi
done

# Function to detect environment based on current branch or workspace
detect_environment() {
    local env=""

    # Try to detect from Terraform workspace
    if [ -f "main/.terraform/environment" ]; then
        env=$(cat main/.terraform/environment)
    fi

    # Try to detect from git branch
    if [ -z "$env" ] && command_exists git; then
        local branch=$(git branch --show-current 2>/dev/null || echo "")
        case $branch in
            main|master|prod|production)
                env="prod"
                ;;
            dev|develop|development)
                env="dev"
                ;;
            *)
                # Check if branch contains environment name
                if [[ $branch =~ (dev|prod) ]]; then
                    env="${BASH_REMATCH[1]}"
                fi
                ;;
        esac
    fi

    echo "$env"
}

# Set environment if not specified
if [ -z "$ENVIRONMENT" ]; then
    ENVIRONMENT=$(detect_environment)
    if [ -z "$ENVIRONMENT" ]; then
        error_exit "Unable to detect environment. Please specify with --env"
    fi
    print $BLUE "Auto-detected environment: $ENVIRONMENT"
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
    error_exit "Invalid environment: $ENVIRONMENT. Must be 'dev' or 'prod'"
fi

# Validate app type
if [[ ! "$APP_TYPE" =~ ^(nextjs|react)$ ]]; then
    error_exit "Invalid app type: $APP_TYPE. Must be 'nextjs' or 'react'"
fi

# Set app directory based on type
case $APP_TYPE in
    nextjs)
        APP_DIR="$NEXTJS_APP_DIR"
        BUILD_COMMAND="npm run build"
        BUILD_OUTPUT_DIR=".next"
        DEPLOY_TARGET="vercel"
        ;;
    react)
        APP_DIR="$REACT_APP_DIR"
        BUILD_COMMAND="npm run build"
        BUILD_OUTPUT_DIR="build"
        DEPLOY_TARGET="s3"
        ;;
esac

# Function to list rollback points
list_rollback_points() {
    print $BLUE "Available rollback points for $ENVIRONMENT/$APP_TYPE:"

    if [ ! -d "$ROLLBACK_DIR/$ENVIRONMENT/$APP_TYPE" ]; then
        print $YELLOW "No rollback points found"
        return
    fi

    ls -1 "$ROLLBACK_DIR/$ENVIRONMENT/$APP_TYPE" | sort -r | head -n "$MAX_ROLLBACK_HISTORY" | while read deployment; do
        local metadata_file="$ROLLBACK_DIR/$ENVIRONMENT/$APP_TYPE/$deployment/metadata.json"
        if [ -f "$metadata_file" ]; then
            local timestamp=$(jq -r '.timestamp' "$metadata_file")
            local commit=$(jq -r '.git_commit' "$metadata_file")
            print $GREEN "  $deployment - $timestamp (commit: $commit)"
        else
            print $GREEN "  $deployment"
        fi
    done
}

# Handle list rollbacks
if [ "$LIST_ROLLBACKS" = true ]; then
    list_rollback_points
    exit 0
fi

# Function to get SSM parameters
get_ssm_parameters() {
    local env=$1
    local params='{}'

    print $BLUE "Fetching SSM parameters for $env environment..."

    # Get all parameters for the environment
    local ssm_output=$(aws ssm get-parameters-by-path \
        --path "/${PROJECT_NAME}/${env}/" \
        --region "$AWS_REGION" \
        --query 'Parameters[*].[Name, Value]' \
        --output json 2>/dev/null) || error_exit "Failed to fetch SSM parameters"

    # Process parameters into a JSON object
    while IFS= read -r line; do
        local name=$(echo "$line" | jq -r '.[0]' | sed "s|/${PROJECT_NAME}/${env}/||")
        local value=$(echo "$line" | jq -r '.[1]')
        params=$(echo "$params" | jq --arg key "$name" --arg val "$value" '. + {($key): $val}')
    done < <(echo "$ssm_output" | jq -c '.[]')

    echo "$params"
}

# Function to validate required parameters
validate_parameters() {
    local params=$1
    local required_params=()

    case $APP_TYPE in
        nextjs)
            required_params=("api_gateway_url" "cognito_user_pool_id" "cognito_client_id")
            ;;
        react)
            required_params=("api_gateway_url" "cognito_user_pool_id" "cognito_client_id" "s3_static_bucket" "cloudfront_distribution_url")
            ;;
    esac

    print $BLUE "Validating required parameters..."

    for param in "${required_params[@]}"; do
        local value=$(echo "$params" | jq -r ".$param // empty")
        if [ -z "$value" ]; then
            error_exit "Required parameter missing: $param"
        fi
        print $GREEN "  ✓ $param: $value"
    done
}

# Function to create deployment backup
create_deployment_backup() {
    local env=$1
    local app=$2
    local deployment_dir="$ROLLBACK_DIR/$env/$app/$DEPLOYMENT_ID"

    print $BLUE "Creating deployment backup..."

    mkdir -p "$deployment_dir"

    # Save metadata
    cat > "$deployment_dir/metadata.json" <<EOF
{
    "deployment_id": "$DEPLOYMENT_ID",
    "environment": "$env",
    "app_type": "$app",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

    # Backup current build
    if [ -d "$APP_DIR/$BUILD_OUTPUT_DIR" ]; then
        cp -r "$APP_DIR/$BUILD_OUTPUT_DIR" "$deployment_dir/"
    fi

    # Backup environment config
    if [ -f "$APP_DIR/.env.production" ]; then
        cp "$APP_DIR/.env.production" "$deployment_dir/"
    fi

    # Clean up old backups
    if [ -d "$ROLLBACK_DIR/$env/$app" ]; then
        ls -1t "$ROLLBACK_DIR/$env/$app" | tail -n +$((MAX_ROLLBACK_HISTORY + 1)) | while read old_deployment; do
            print $YELLOW "Removing old backup: $old_deployment"
            rm -rf "$ROLLBACK_DIR/$env/$app/$old_deployment"
        done
    fi
}

# Function to rollback deployment
rollback_deployment() {
    local rollback_id=$1
    local env=$2
    local app=$3
    local rollback_dir="$ROLLBACK_DIR/$env/$app/$rollback_id"

    if [ ! -d "$rollback_dir" ]; then
        error_exit "Rollback point not found: $rollback_id"
    fi

    print $BLUE "Rolling back to deployment: $rollback_id"

    # Restore build output
    if [ -d "$rollback_dir/$BUILD_OUTPUT_DIR" ]; then
        rm -rf "$APP_DIR/$BUILD_OUTPUT_DIR"
        cp -r "$rollback_dir/$BUILD_OUTPUT_DIR" "$APP_DIR/"
        print $GREEN "  ✓ Restored build output"
    fi

    # Restore env config
    if [ -f "$rollback_dir/.env.production" ]; then
        cp "$rollback_dir/.env.production" "$APP_DIR/"
        print $GREEN "  ✓ Restored environment config"
    fi

    # Deploy the restored version
    deploy_application "$env" "$app"

    print $GREEN "✅ Rollback completed successfully!"
}

# Function to build application
build_application() {
    local env=$1
    local params=$2

    print $BLUE "Building $APP_TYPE application for $env environment..."

    cd "$APP_DIR" || error_exit "Failed to change to app directory: $APP_DIR"

    # Create environment file
    case $APP_TYPE in
        nextjs)
            cat > .env.production <<EOF
NEXT_PUBLIC_API_GATEWAY_URL=$(echo "$params" | jq -r '.api_gateway_url')
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$(echo "$params" | jq -r '.cognito_user_pool_id')
NEXT_PUBLIC_COGNITO_CLIENT_ID=$(echo "$params" | jq -r '.cognito_client_id')
NEXT_PUBLIC_COGNITO_REGION=$AWS_REGION
NEXT_PUBLIC_WEBSOCKET_API_URL=$(echo "$params" | jq -r '.websocket_api_url // empty')
NODE_ENV=production
EOF
            ;;
        react)
            cat > .env.production <<EOF
REACT_APP_API_GATEWAY_URL=$(echo "$params" | jq -r '.api_gateway_url')
REACT_APP_COGNITO_USER_POOL_ID=$(echo "$params" | jq -r '.cognito_user_pool_id')
REACT_APP_COGNITO_CLIENT_ID=$(echo "$params" | jq -r '.cognito_client_id')
REACT_APP_COGNITO_REGION=$AWS_REGION
REACT_APP_WEBSOCKET_API_URL=$(echo "$params" | jq -r '.websocket_api_url // empty')
NODE_ENV=production
EOF
            ;;
    esac

    # Install dependencies
    print $BLUE "Installing dependencies..."
    npm install || error_exit "Failed to install dependencies"

    # Build application
    print $BLUE "Building application..."
    $BUILD_COMMAND || error_exit "Build failed"

    cd - > /dev/null
}

# Function to deploy application
deploy_application() {
    local env=$1
    local app=$2

    print $BLUE "Deploying $app application to $env environment..."

    cd "$APP_DIR" || error_exit "Failed to change to app directory: $APP_DIR"

    case $APP_TYPE in
        nextjs)
            # Deploy to Vercel
            if [ "$DRY_RUN" = true ]; then
                print $BLUE "[DRY RUN] Would deploy to Vercel"
            else
                if [ "$env" = "prod" ]; then
                    npm run deploy:production || error_exit "Vercel deployment failed"
                else
                    npm run deploy:preview || error_exit "Vercel deployment failed"
                fi
            fi
            ;;
        react)
            # Deploy to S3/CloudFront
            local s3_bucket=$(echo "$PARAMETERS" | jq -r '.s3_static_bucket')
            local cloudfront_id=$(echo "$PARAMETERS" | jq -r '.cloudfront_distribution_id // empty')

            if [ "$DRY_RUN" = true ]; then
                print $BLUE "[DRY RUN] Would sync to S3: $s3_bucket"
                [ -n "$cloudfront_id" ] && print $BLUE "[DRY RUN] Would invalidate CloudFront: $cloudfront_id"
            else
                # Sync to S3
                aws s3 sync "$BUILD_OUTPUT_DIR/" "s3://$s3_bucket/" \
                    --delete \
                    --cache-control "public,max-age=31536000,immutable" \
                    --exclude "index.html" \
                    --exclude "*.json" \
                    --region "$AWS_REGION" || error_exit "S3 sync failed"

                # Upload index.html and JSON files with no cache
                aws s3 cp "$BUILD_OUTPUT_DIR/" "s3://$s3_bucket/" \
                    --recursive \
                    --cache-control "no-cache,no-store,must-revalidate" \
                    --exclude "*" \
                    --include "index.html" \
                    --include "*.json" \
                    --region "$AWS_REGION" || error_exit "S3 copy failed"

                # Invalidate CloudFront
                if [ -n "$cloudfront_id" ]; then
                    print $BLUE "Invalidating CloudFront distribution..."
                    aws cloudfront create-invalidation \
                        --distribution-id "$cloudfront_id" \
                        --paths "/*" \
                        --region "$AWS_REGION" || error_exit "CloudFront invalidation failed"
                fi
            fi
            ;;
    esac

    cd - > /dev/null
}

# Function to perform health check
health_check() {
    local env=$1
    local app=$2
    local url=""

    print $BLUE "Performing health check..."

    case $APP_TYPE in
        nextjs)
            # For Vercel deployments, we'll need to get the URL from deployment output
            # This is a simplified check
            url="https://${PROJECT_NAME}-${env}.vercel.app"
            ;;
        react)
            url=$(echo "$PARAMETERS" | jq -r '.cloudfront_distribution_url // empty')
            ;;
    esac

    if [ -n "$url" ]; then
        print $BLUE "Checking health at: $url"

        # Perform health check
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

        if [[ "$response" =~ ^(200|301|302)$ ]]; then
            print $GREEN "  ✓ Health check passed (HTTP $response)"
            return 0
        else
            print $RED "  ✗ Health check failed (HTTP $response)"
            return 1
        fi
    else
        print $YELLOW "  ⚠ No health check URL available"
        return 0
    fi
}

# Main deployment flow
main() {
    # Handle rollback
    if [ -n "$ROLLBACK_ID" ]; then
        rollback_deployment "$ROLLBACK_ID" "$ENVIRONMENT" "$APP_TYPE"
        exit 0
    fi

    print $GREEN "🚀 Starting deployment process"
    print $BLUE "Environment: $ENVIRONMENT"
    print $BLUE "Application: $APP_TYPE"

    # Get SSM parameters
    PARAMETERS=$(get_ssm_parameters "$ENVIRONMENT")

    # Validate parameters
    validate_parameters "$PARAMETERS"

    if [ "$DRY_RUN" = true ]; then
        print $YELLOW "DRY RUN: No actual deployment will be performed"
    fi

    # Create deployment backup (for rollback)
    if [ "$DRY_RUN" = false ]; then
        create_deployment_backup "$ENVIRONMENT" "$APP_TYPE"
    fi

    # Build application
    build_application "$ENVIRONMENT" "$PARAMETERS"

    # Deploy application
    deploy_application "$ENVIRONMENT" "$APP_TYPE"

    # Perform health check
    if [ "$DRY_RUN" = false ]; then
        if ! health_check "$ENVIRONMENT" "$APP_TYPE"; then
            print $RED "Health check failed! Consider rolling back with:"
            print $YELLOW "  $0 --env $ENVIRONMENT --app $APP_TYPE --rollback $DEPLOYMENT_ID"
            exit 1
        fi
    fi

    print $GREEN "✅ Deployment completed successfully!"
    print $BLUE "Deployment ID: $DEPLOYMENT_ID"
}

# Run main function
main
