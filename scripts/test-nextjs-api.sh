#!/bin/bash

# Test the Next.js API routes that the frontend actually uses

set -e

echo "🔍 Testing Next.js API routes that frontend calls..."
echo ""

# You'll need to update this URL to your actual Vercel deployment
VERCEL_URL="https://nextjs-cae7wmioj-wyatts-projects-eccf22ae.vercel.app"
VERCEL_API_URL="$VERCEL_URL/api/data/athena"

echo "Testing Vercel URL: $VERCEL_API_URL"
echo ""

# Test 1: Simple query through Next.js API
echo "📋 Test 1: Simple query through Next.js API"
curl -X POST "$VERCEL_API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_query",
    "query": "SELECT COUNT(*) as total FROM forecast WHERE business_date >= DATE '\''2025-01-01'\'' AND business_date <= DATE '\''2025-01-07'\''"
  }' | jq .

echo ""
echo "---"
echo ""

# Test 2: Test what the hybrid service actually calls
echo "📋 Test 2: Test hybrid service style query"
curl -X POST "$VERCEL_API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_query",
    "query": "SELECT * FROM forecast WHERE business_date >= DATE '\''2025-01-01'\'' AND business_date <= DATE '\''2025-01-14'\'' ORDER BY business_date DESC LIMIT 10"
  }' | jq .

echo ""
echo "---"
echo ""

# Test 3: Test the forecast cache API
echo "📋 Test 3: Test forecast cache API"
curl -X GET "$VERCEL_URL/api/forecast/cache?action=get_summary&fingerprint=test123" \
  -H "Content-Type: application/json" | jq .

echo ""
echo "🎉 Next.js API tests completed!"
