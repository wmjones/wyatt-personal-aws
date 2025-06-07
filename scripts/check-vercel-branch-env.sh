#!/bin/bash

# Check and update Vercel branch-specific environment variables
# Usage: ./check-vercel-branch-env.sh [branch-name]

set -e

BRANCH_NAME=${1:-$(git rev-parse --abbrev-ref HEAD)}
echo "Checking environment variables for branch: $BRANCH_NAME"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel@latest
fi

# Function to check if a variable exists
check_env_var() {
    local VAR_NAME=$1
    local BRANCH=$2

    echo -n "Checking $VAR_NAME... "
    if vercel env ls preview | grep -E "^$VAR_NAME.*$BRANCH" > /dev/null 2>&1; then
        echo "✓ Found"
        return 0
    else
        echo "✗ Not found"
        return 1
    fi
}

# Check each required variable
echo ""
echo "Checking branch-specific variables:"
check_env_var "DATABASE_URL" "$BRANCH_NAME" || MISSING_VARS=true
check_env_var "DATABASE_URL_UNPOOLED" "$BRANCH_NAME" || MISSING_VARS=true
check_env_var "DEPLOYMENT_BRANCH" "$BRANCH_NAME" || MISSING_VARS=true

# Pull current environment to see values
echo ""
echo "Pulling current environment values..."
cd src/frontend/nextjs-app
vercel env pull .env.branch-check --environment=preview --git-branch="$BRANCH_NAME" 2>/dev/null || {
    echo "Failed to pull environment - variables might not be set"
}

if [ -f .env.branch-check ]; then
    echo ""
    echo "Current values:"
    echo "----------------------------------------"
    grep -E "^(DATABASE_URL|DEPLOYMENT_BRANCH)" .env.branch-check || echo "No database variables found"
    echo "----------------------------------------"
    rm .env.branch-check
fi

echo ""
echo "To manually update variables, use:"
echo "  vercel env rm DATABASE_URL preview $BRANCH_NAME --yes"
echo "  echo 'your-database-url' | vercel env add DATABASE_URL preview $BRANCH_NAME"
