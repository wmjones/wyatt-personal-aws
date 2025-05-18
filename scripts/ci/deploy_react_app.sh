#!/bin/bash
set -e

# This script builds and deploys the React app to S3 and invalidates CloudFront
# It's useful for local testing or if you need to manually deploy without GitHub Actions

# Configuration variables
ENVIRONMENT=${1:-dev}  # Default to dev if not specified
AWS_REGION="us-east-2"  # Update this with your AWS region
REACT_APP_DIR="/workspaces/wyatt-personal-aws/src/frontend/react-app"
BUILD_DIR="$REACT_APP_DIR/build"

echo "Building and deploying React app to $ENVIRONMENT environment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Get AWS resource information from SSM parameters
echo "Getting AWS resource information..."
BUCKET_NAME=$(aws ssm get-parameter --name "/wyatt-personal-aws-$ENVIRONMENT/frontend_bucket_name" --query "Parameter.Value" --output text)
CF_ID=$(aws ssm get-parameter --name "/wyatt-personal-aws-$ENVIRONMENT/cloudfront_id" --query "Parameter.Value" --output text --region $AWS_REGION 2>/dev/null || echo "")
USER_POOL_ID=$(aws ssm get-parameter --name "/wyatt-personal-aws-$ENVIRONMENT/cognito_user_pool_id" --query "Parameter.Value" --output text 2>/dev/null || echo "us-east-2_xxxxxxxx")
CLIENT_ID=$(aws ssm get-parameter --name "/wyatt-personal-aws-$ENVIRONMENT/cognito_client_id" --query "Parameter.Value" --output text 2>/dev/null || echo "xxxxxxxxxxxxxxxxxxxxxxxxxx")
API_ENDPOINT=$(aws ssm get-parameter --name "/wyatt-personal-aws-$ENVIRONMENT/api_endpoint" --query "Parameter.Value" --output text 2>/dev/null || echo "https://api.example.com")

# Check if bucket name was retrieved successfully
if [ -z "$BUCKET_NAME" ] || [ "$BUCKET_NAME" == "None" ]; then
    echo "Failed to get S3 bucket name. Please run the SSM parameters setup workflow or store-terraform-outputs.sh script first."
    exit 1
fi

# Set environment variables for the build
echo "Setting environment variables for $ENVIRONMENT environment..."
ENV_FILE="$REACT_APP_DIR/.env.production.local"
echo "REACT_APP_STAGE=$ENVIRONMENT" > $ENV_FILE
echo "REACT_APP_REGION=$AWS_REGION" >> $ENV_FILE
echo "REACT_APP_USER_POOL_ID=$USER_POOL_ID" >> $ENV_FILE
echo "REACT_APP_USER_POOL_CLIENT_ID=$CLIENT_ID" >> $ENV_FILE
echo "REACT_APP_API_ENDPOINT=$API_ENDPOINT" >> $ENV_FILE

# Increase memory for Node.js
export NODE_OPTIONS=--max_old_space_size=4096

# Build the React app
echo "Building React app..."
cd $REACT_APP_DIR

# Install ajv dependencies first to ensure they're available
npm install --no-save ajv@8.12.0 ajv-keywords@5.1.0

# Install all dependencies
npm install

# Build with CI=false to ignore warnings
CI=false npm run build

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo "Failed to build React app. Check for errors above."
    exit 1
fi

echo "React app built successfully!"

# Deploy to S3 bucket
echo "Deploying to S3 bucket: $BUCKET_NAME"

# Upload static assets with long-term caching
echo "Uploading static assets with long-term caching..."
aws s3 sync $BUILD_DIR s3://$BUCKET_NAME/ \
    --delete \
    --cache-control "max-age=31536000,public" \
    --exclude "*.html" \
    --exclude "*.json" \
    --exclude "*.txt" \
    --exclude "asset-manifest.json" \
    --region $AWS_REGION

# Upload HTML and JSON files with no caching
echo "Uploading HTML, JSON, and config files with no caching..."
aws s3 sync $BUILD_DIR s3://$BUCKET_NAME/ \
    --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
    --include "*.html" \
    --include "*.json" \
    --include "*.txt" \
    --exclude "static/**/*" \
    --region $AWS_REGION

# If CloudFront distribution ID is available, invalidate the cache
if [ -n "$CF_ID" ] && [ "$CF_ID" != "None" ]; then
    echo "Invalidating CloudFront distribution: $CF_ID"
    aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*" --region $AWS_REGION
else
    echo "No CloudFront distribution ID found. Skipping cache invalidation."
fi

echo "Deployment completed successfully!"

# Get and display the website URL
if [ -n "$CF_ID" ] && [ "$CF_ID" != "None" ]; then
    CF_DOMAIN=$(aws cloudfront get-distribution --id $CF_ID --query "Distribution.DomainName" --output text --region $AWS_REGION)
    echo "Website URL: https://$CF_DOMAIN"
else
    echo "Website URL: http://$BUCKET_NAME.s3-website.$AWS_REGION.amazonaws.com"
fi
