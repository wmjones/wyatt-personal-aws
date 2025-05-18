#\!/bin/bash
# Verify API Gateway fixes

echo "Verifying API Gateway fixes..."

cd /workspaces/wyatt-personal-aws/main

# Check authorizer fix
if grep -q "each.value.authorizer_type == \"REQUEST\"" modules/api_gateway/main.tf; then
    echo "✓ Authorizer fix applied"
else
    echo "✗ Authorizer fix missing"
fi

# Check CORS route fix
if grep -q "replace(key, \"/\^(GET|POST|PUT|DELETE|PATCH) /\"" modules/api_gateway/main.tf; then
    echo "✓ CORS route fix applied"
else
    echo "✗ CORS route fix missing"
fi

echo "Fixes verified\!"
