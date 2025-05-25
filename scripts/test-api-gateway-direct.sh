#!/bin/bash

# Test the API Gateway endpoint directly to troubleshoot frontend issues

set -e

API_BASE_URL="https://v1zx8vrzzj.execute-api.us-east-2.amazonaws.com"
API_ENDPOINT="/api/data/athena/query"

echo "🔍 Testing API Gateway endpoint directly..."
echo "URL: $API_BASE_URL$API_ENDPOINT"
echo ""

# Test 1: Simple date range query (first week)
echo "📋 Test 1: Simple date range query (first week)"
curl -X POST "$API_BASE_URL$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_query",
    "query": "SELECT COUNT(*) as total_rows FROM forecast WHERE business_date >= DATE '\''2025-01-01'\'' AND business_date <= DATE '\''2025-01-07'\''"
  }' | jq .

echo ""
echo "---"
echo ""

# Test 2: Test the hybrid service style query (get_forecast_data equivalent)
echo "📋 Test 2: Test forecast data query (similar to frontend)"
curl -X POST "$API_BASE_URL$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_query",
    "query": "SELECT * FROM forecast WHERE business_date >= DATE '\''2025-01-01'\'' AND business_date <= DATE '\''2025-01-14'\'' ORDER BY business_date DESC LIMIT 50"
  }' | jq .

echo ""
echo "---"
echo ""

# Test 3: Check the get_forecast_by_date action directly
echo "📋 Test 3: Test get_forecast_by_date action"
curl -X POST "$API_BASE_URL$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_forecast_by_date",
    "filters": {
      "start_date": "2025-01-01",
      "end_date": "2025-01-14"
    }
  }' | jq .

echo ""
echo "---"
echo ""

# Test 4: Test a query that might match the frontend error
echo "📋 Test 4: Test full range query (all 90 days)"
curl -X POST "$API_BASE_URL$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_query",
    "query": "SELECT business_date, COUNT(*) as count FROM forecast WHERE business_date >= DATE '\''2025-01-01'\'' AND business_date <= DATE '\''2025-03-31'\'' GROUP BY business_date ORDER BY business_date LIMIT 10"
  }' | jq .

echo ""
echo "🎉 API Gateway tests completed!"
