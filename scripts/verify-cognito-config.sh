#!/bin/bash
set -e

# This script checks the Cognito configuration and SSM parameters
# to validate that everything is set up correctly for authentication.

# Configuration variables
ENVIRONMENT=${1:-dev}  # Default to dev if not specified
AWS_REGION="us-east-2"  # Update this with your AWS region

echo "Verifying Cognito configuration for $ENVIRONMENT environment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

echo "Checking SSM parameters..."

# Check Cognito User Pool ID
USER_POOL_ID=$(aws ssm get-parameter --name "/wyatt-personal-aws-$ENVIRONMENT/cognito_user_pool_id" --query "Parameter.Value" --output text 2>/dev/null || echo "NOT_FOUND")
echo "Cognito User Pool ID: $USER_POOL_ID"
if [[ "$USER_POOL_ID" == "NOT_FOUND" ]]; then
    echo "⚠️ Parameter not found in SSM. This will cause authentication issues."
else
    echo "✅ SSM parameter exists."

    # Verify User Pool exists in AWS
    echo "Verifying User Pool in AWS..."
    aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ User Pool exists in AWS."
    else
        echo "⚠️ User Pool does not exist in AWS or cannot be accessed."
    fi
fi

# Check Cognito Client ID
CLIENT_ID=$(aws ssm get-parameter --name "/wyatt-personal-aws-$ENVIRONMENT/cognito_client_id" --query "Parameter.Value" --output text 2>/dev/null || echo "NOT_FOUND")
echo "Cognito Client ID: $CLIENT_ID"
if [[ "$CLIENT_ID" == "NOT_FOUND" ]]; then
    echo "⚠️ Parameter not found in SSM. This will cause authentication issues."
else
    echo "✅ SSM parameter exists."

    # Verify Client exists in AWS
    if [[ "$USER_POOL_ID" != "NOT_FOUND" ]]; then
        echo "Verifying User Pool Client in AWS..."
        aws cognito-idp describe-user-pool-client --user-pool-id $USER_POOL_ID --client-id $CLIENT_ID > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ User Pool Client exists in AWS."
        else
            echo "⚠️ User Pool Client does not exist in AWS or cannot be accessed."
        fi
    fi
fi

# Check if Terraform outputs are available locally
echo -e "\nChecking Terraform outputs..."
cd ../main

terraform output cognito_user_pool_id 2>/dev/null
TF_USER_POOL_ID_STATUS=$?
terraform output cognito_client_id 2>/dev/null
TF_CLIENT_ID_STATUS=$?

if [ $TF_USER_POOL_ID_STATUS -eq 0 ] && [ $TF_CLIENT_ID_STATUS -eq 0 ]; then
    echo "✅ Terraform outputs are available locally. You can run the store-terraform-outputs.sh script."
else
    echo "⚠️ Terraform outputs are not available locally. This is expected if using Terraform Cloud."
    echo "   You may need to run 'terraform login' first, or access the outputs from the Terraform Cloud UI."
fi

# Suggest next steps
echo -e "\nNext steps:"
if [[ "$USER_POOL_ID" == "NOT_FOUND" ]] || [[ "$CLIENT_ID" == "NOT_FOUND" ]]; then
    echo "1. Ensure you have run terraform apply to create the Cognito resources."
    echo "2. Run the store-terraform-outputs.sh script to store the outputs in SSM."
    echo "3. Set the correct environment variables in your React app's .env.production.local file."
else
    echo "Your Cognito configuration appears to be set up correctly in SSM."
    echo "Make sure your React app's environment variables match these values."
fi
