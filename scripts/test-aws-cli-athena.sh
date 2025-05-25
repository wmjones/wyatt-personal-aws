#!/bin/bash

# Script to test Athena queries using AWS CLI to validate frontend queries

set -e

# Configuration
DATABASE="forecast_data_dev"
WORKGROUP="wyatt-personal-aws-dev-forecast-analysis-dev"
OUTPUT_LOCATION="s3://wyatt-personal-aws-dev-athena-results-dev-499f9264/query-results/"
TABLE="forecast"

echo "🔍 Testing Athena queries with AWS CLI..."
echo "Database: $DATABASE"
echo "Workgroup: $WORKGROUP"
echo "Table: $TABLE"
echo ""

# Function to execute query and wait for results
execute_query() {
    local query="$1"
    local description="$2"

    echo "📋 $description"
    echo "Query: $query"
    echo ""

    # Start query execution
    QUERY_ID=$(aws athena start-query-execution \
        --query-string "$query" \
        --result-configuration OutputLocation="$OUTPUT_LOCATION" \
        --query-execution-context Database="$DATABASE" \
        --work-group "$WORKGROUP" \
        --output text --query 'QueryExecutionId')

    echo "Query ID: $QUERY_ID"

    # Wait for query to complete
    STATUS="RUNNING"
    while [ "$STATUS" == "RUNNING" ] || [ "$STATUS" == "QUEUED" ]; do
        sleep 2
        STATUS=$(aws athena get-query-execution \
            --query-execution-id "$QUERY_ID" \
            --query "QueryExecution.Status.State" \
            --output text)
        echo "Status: $STATUS"
    done

    if [ "$STATUS" == "SUCCEEDED" ]; then
        echo "✅ Query succeeded!"

        # Get results
        echo "Results:"
        aws athena get-query-results \
            --query-execution-id "$QUERY_ID" \
            --query 'ResultSet.Rows[*].Data[*].VarCharValue' \
            --output table
    else
        echo "❌ Query failed!"
        aws athena get-query-execution \
            --query-execution-id "$QUERY_ID" \
            --query "QueryExecution.Status.StateChangeReason" \
            --output text
    fi

    echo ""
    echo "---"
    echo ""
}

# Test 1: Check table exists and basic structure
execute_query "SHOW TABLES" "Check if forecast table exists"

# Test 2: Check date range in data
execute_query "
SELECT
  MIN(business_date) as min_date,
  MAX(business_date) as max_date,
  COUNT(DISTINCT business_date) as unique_dates,
  COUNT(*) as total_rows
FROM $TABLE
" "Check date range and row count"

# Test 3: Sample data from first few days
execute_query "
SELECT
  business_date,
  restaurant_id,
  inventory_item_id,
  state,
  y_50
FROM $TABLE
WHERE business_date <= DATE '2025-01-05'
ORDER BY business_date, restaurant_id
LIMIT 10
" "Sample data from first few days"

# Test 4: Test the exact query pattern that frontend uses (with DATE casting)
execute_query "
SELECT * FROM $TABLE
WHERE business_date >= DATE '2025-01-01'
  AND business_date <= DATE '2025-01-07'
ORDER BY business_date DESC
LIMIT 10
" "Test frontend-style query with DATE casting (first week)"

# Test 5: Test a broader range that might match frontend
execute_query "
SELECT
  business_date,
  COUNT(*) as row_count,
  AVG(y_50) as avg_forecast
FROM $TABLE
WHERE business_date >= DATE '2025-01-01'
  AND business_date <= DATE '2025-03-31'
GROUP BY business_date
ORDER BY business_date
LIMIT 10
" "Test full date range aggregation (first 10 days)"

# Test 6: Check if any data exists for edge dates
execute_query "
SELECT COUNT(*) as count_2025_01_01 FROM $TABLE WHERE business_date = DATE '2025-01-01'
" "Check data exists for 2025-01-01"

execute_query "
SELECT COUNT(*) as count_2025_03_31 FROM $TABLE WHERE business_date = DATE '2025-03-31'
" "Check data exists for 2025-03-31"

execute_query "
SELECT COUNT(*) as count_2025_04_01 FROM $TABLE WHERE business_date = DATE '2025-04-01'
" "Check no data exists for 2025-04-01"

echo "🎉 All Athena tests completed!"
echo ""
echo "Next steps:"
echo "1. If all queries succeeded, the issue may be in the API Gateway or Lambda"
echo "2. Check the Lambda function logs in CloudWatch"
echo "3. Test the API Gateway endpoint directly"
