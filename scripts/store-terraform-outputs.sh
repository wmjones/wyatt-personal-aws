#!/bin/bash
set -e

# This script stores Terraform outputs as SSM parameters for use in the CI/CD pipeline
# Run this script after terraform apply to ensure the latest values are available

# Configuration variables
ENVIRONMENT=${1:-dev}  # Default to dev if not specified
AWS_REGION="us-east-2"  # Update this with your AWS region

echo "Storing Terraform outputs as SSM parameters for $ENVIRONMENT environment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if terraform command is available
if ! command -v terraform &> /dev/null; then
    echo "Terraform is not installed. Please install it first."
    exit 1
fi

# Get current directory
CURRENT_DIR=$(pwd)
cd main

# Make sure we're in the Terraform main directory
if [ ! -f "main.tf" ]; then
    echo "This script must be run from the project root directory."
    cd $CURRENT_DIR
    exit 1
fi

# Get Terraform outputs
echo "Retrieving Terraform outputs..."
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null || echo "")
COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id 2>/dev/null || echo "")
API_ENDPOINT=$(terraform output -raw api_endpoint 2>/dev/null || echo "")
FRONTEND_BUCKET=$(terraform output -raw website_bucket_name 2>/dev/null || echo "")
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")

# Check if outputs were retrieved successfully
if [ -z "$COGNITO_USER_POOL_ID" ] || [ -z "$COGNITO_CLIENT_ID" ]; then
    echo "Failed to get Cognito outputs from Terraform. Please run terraform apply first."
    cd $CURRENT_DIR
    exit 1
fi

# Create or update SSM parameters
echo "Storing Cognito User Pool ID in SSM..."
aws ssm put-parameter \
    --name "/wyatt-personal-aws-$ENVIRONMENT/cognito_user_pool_id" \
    --value "$COGNITO_USER_POOL_ID" \
    --type "String" \
    --overwrite \
    --region $AWS_REGION

echo "Storing Cognito Client ID in SSM..."
aws ssm put-parameter \
    --name "/wyatt-personal-aws-$ENVIRONMENT/cognito_client_id" \
    --value "$COGNITO_CLIENT_ID" \
    --type "String" \
    --overwrite \
    --region $AWS_REGION

echo "Storing API endpoint in SSM..."
aws ssm put-parameter \
    --name "/wyatt-personal-aws-$ENVIRONMENT/api_endpoint" \
    --value "$API_ENDPOINT" \
    --type "String" \
    --overwrite \
    --region $AWS_REGION

echo "Storing frontend bucket name in SSM..."
aws ssm put-parameter \
    --name "/wyatt-personal-aws-$ENVIRONMENT/frontend_bucket_name" \
    --value "$FRONTEND_BUCKET" \
    --type "String" \
    --overwrite \
    --region $AWS_REGION

echo "Storing CloudFront distribution ID in SSM..."
aws ssm put-parameter \
    --name "/wyatt-personal-aws-$ENVIRONMENT/cloudfront_id" \
    --value "$CLOUDFRONT_ID" \
    --type "String" \
    --overwrite \
    --region $AWS_REGION

echo "Parameters stored successfully!"
cd $CURRENT_DIR
