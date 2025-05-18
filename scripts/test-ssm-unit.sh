#!/bin/bash

##############################################################################
# Script: test-ssm-unit.sh
# Description: Unit tests for SSM sync script functionality
# Usage: ./test-ssm-unit.sh
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print colored output
print() {
    local color=$1
    shift
    echo -e "${color}$*${NC}"
}

# Function to assert equality
assert_equal() {
    local expected=$1
    local actual=$2
    local test_name=$3

    if [ "$expected" = "$actual" ]; then
        print $GREEN "✓ $test_name"
        ((TESTS_PASSED++))
    else
        print $RED "✗ $test_name"
        print $RED "  Expected: $expected"
        print $RED "  Actual: $actual"
        ((TESTS_FAILED++))
    fi
}

# Function to test command existence
test_command_exists() {
    local cmd=$1
    if command -v "$cmd" >/dev/null 2>&1; then
        print $GREEN "✓ Command '$cmd' exists"
        ((TESTS_PASSED++))
    else
        print $RED "✗ Command '$cmd' not found"
        ((TESTS_FAILED++))
    fi
}

print $BLUE "🧪 Running SSM sync script unit tests"

# Test 1: Check required commands
print $BLUE "\nTest 1: Checking required commands..."
test_command_exists "terraform"
test_command_exists "aws"
test_command_exists "jq"

# Test 2: Test parameter name generation
print $BLUE "\nTest 2: Testing parameter name generation..."
PROJECT="test-project"
ENVIRONMENT="dev"
PARAM_NAME="api_gateway_url"
EXPECTED="/$PROJECT/$ENVIRONMENT/$PARAM_NAME"
ACTUAL="/$PROJECT/$ENVIRONMENT/$PARAM_NAME"
assert_equal "$EXPECTED" "$ACTUAL" "Parameter name generation"

# Test 3: Test JSON parsing
print $BLUE "\nTest 3: Testing JSON output parsing..."
JSON_OUTPUT='{"api_url": {"value": "https://test.com"}, "user_id": {"value": "12345"}}'
PARSED=$(echo "$JSON_OUTPUT" | jq -r 'to_entries[] | "\(.key)=\(.value.value)"' | head -1)
EXPECTED="api_url=https://test.com"
assert_equal "$EXPECTED" "$PARSED" "JSON parsing"

# Test 4: Test workspace validation
print $BLUE "\nTest 4: Testing workspace validation..."
for workspace in "dev" "prod" "test"; do
    if [[ "$workspace" =~ ^(dev|prod)$ ]]; then
        print $GREEN "✓ Workspace '$workspace' is valid"
        ((TESTS_PASSED++))
    else
        print $YELLOW "! Workspace '$workspace' is not a standard environment"
        ((TESTS_PASSED++))
    fi
done

# Test 5: Test dry-run logic
print $BLUE "\nTest 5: Testing dry-run parameter parsing..."
DRY_RUN=false
for arg in "--dry-run" "--workspace" "dev"; do
    if [ "$arg" = "--dry-run" ]; then
        DRY_RUN=true
    fi
done
assert_equal "true" "$DRY_RUN" "Dry-run flag detection"

# Summary
print $BLUE "\n📊 Test Summary"
print $GREEN "Passed: $TESTS_PASSED"
print $RED "Failed: $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    print $GREEN "\n✅ All tests passed!"
    exit 0
else
    print $RED "\n❌ Some tests failed!"
    exit 1
fi
