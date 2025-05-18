#!/bin/bash

##############################################################################
# Script: test-ssm-locally.sh
# Description: Test SSM sync script locally with mock Terraform outputs
# Usage: ./test-ssm-locally.sh
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print() {
    local color=$1
    shift
    echo -e "${color}$*${NC}"
}

# Change to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

print $GREEN "🔬 Testing SSM sync script locally"

# Method 1: Test with dry-run
print $BLUE "\n1. Testing with dry-run mode..."
if [ -x "./scripts/sync-terraform-outputs-to-ssm.sh" ]; then
    ./scripts/sync-terraform-outputs-to-ssm.sh --dry-run --workspace dev
else
    print $RED "sync-terraform-outputs-to-ssm.sh not found or not executable"
fi

# Method 2: Test with mock Terraform outputs
print $BLUE "\n2. Creating mock Terraform outputs..."

# Create a mock terraform directory
mkdir -p test-terraform
cd test-terraform

# Create mock terraform.tfstate with sample outputs
cat > terraform.tfstate <<'EOF'
{
  "version": 4,
  "terraform_version": "1.6.0",
  "serial": 1,
  "lineage": "mock-lineage",
  "outputs": {
    "api_gateway_url": {
      "value": "https://mockapi.execute-api.us-east-2.amazonaws.com/prod",
      "type": "string",
      "sensitive": false
    },
    "cognito_user_pool_id": {
      "value": "us-east-2_mock123456",
      "type": "string",
      "sensitive": false
    },
    "cognito_client_id": {
      "value": "mockclientid123456789",
      "type": "string",
      "sensitive": false
    },
    "s3_static_bucket": {
      "value": "mock-static-bucket-dev",
      "type": "string",
      "sensitive": false
    },
    "cloudfront_url": {
      "value": "https://d1234567890.cloudfront.net",
      "type": "string",
      "sensitive": false
    }
  },
  "resources": []
}
EOF

# Create a simple output.tf for terraform output command
cat > output.tf <<EOF
output "api_gateway_url" {
  value = "https://mockapi.execute-api.us-east-2.amazonaws.com/prod"
}

output "cognito_user_pool_id" {
  value = "us-east-2_mock123456"
}

output "cognito_client_id" {
  value = "mockclientid123456789"
}

output "s3_static_bucket" {
  value = "mock-static-bucket-dev"
}

output "cloudfront_url" {
  value = "https://d1234567890.cloudfront.net"
}
EOF

print $BLUE "\n3. Testing with mock outputs (dry-run)..."
# Temporarily modify the script to use our test directory
cp ../scripts/sync-terraform-outputs-to-ssm.sh ./test-sync-script.sh
sed -i 's|TERRAFORM_DIR="main"|TERRAFORM_DIR="test-terraform"|g' ./test-sync-script.sh
chmod +x ./test-sync-script.sh

# Run the test with default workspace
./test-sync-script.sh --dry-run

# Method 3: Test parameter validation
print $BLUE "\n4. Testing AWS SSM parameter operations..."

# Check if AWS CLI is configured
if aws sts get-caller-identity >/dev/null 2>&1; then
    print $GREEN "AWS CLI is configured"

    # Test listing parameters (without actually creating them)
    print $BLUE "Listing existing SSM parameters for this project..."
    aws ssm get-parameters-by-path \
        --path "/wyatt-personal-aws/dev/" \
        --query 'Parameters[*].[Name, Type]' \
        --output table \
        --region us-east-2 || print $YELLOW "No parameters found (this is normal if none exist)"
else
    print $YELLOW "AWS CLI not configured - skipping AWS operations"
fi

# Cleanup
cd "$PROJECT_ROOT"
rm -rf test-terraform

print $GREEN "\n✅ Local testing completed!"
print $BLUE "\nTo test with real Terraform outputs:"
print $YELLOW "1. cd main"
print $YELLOW "2. terraform workspace select dev"
print $YELLOW "3. terraform output -json"
print $YELLOW "4. ../scripts/sync-terraform-outputs-to-ssm.sh --dry-run"
