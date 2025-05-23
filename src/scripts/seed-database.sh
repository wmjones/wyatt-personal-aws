#!/bin/bash

# Script to upload forecast data to S3 and set up Athena table
# This script uses AWS CLI instead of a complex Node.js application

# Configuration
BUCKET_NAME="wyatt-personal-aws-dev-datalake-dev-35315550"
DATA_FOLDER="forecast_data"
CSV_PATH="/workspaces/wyatt-personal-aws/data/forecast_data.csv"
ATHENA_DATABASE="forecast_data_dev"
ATHENA_WORKGROUP="wyatt-personal-aws-dev-forecast-analysis-dev"
ATHENA_OUTPUT_LOCATION="s3://wyatt-personal-aws-dev-athena-results-dev-499f9264/query-results/"
FORECAST_TABLE_NAME="forecast"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    exit 1
fi

# Check if CSV file exists
if [ ! -f "$CSV_PATH" ]; then
    echo "Error: CSV file not found at $CSV_PATH"
    exit 1
fi

echo "Starting forecast data upload process..."

# Upload CSV file to S3
echo "Uploading CSV file to S3: s3://$BUCKET_NAME/$DATA_FOLDER/forecast_data.csv"
echo "Checking if bucket exists..."

# Check if bucket exists
if ! aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
    echo "Warning: Bucket s3://$BUCKET_NAME does not exist yet."
    echo "This is expected if you haven't deployed the Terraform infrastructure."
    echo "When you deploy the infrastructure, you can run this script again."
    echo ""
    echo "CSV file validation: Checking file structure instead of uploading"
    # Display first few lines of the CSV for validation
    echo "CSV file header:"
    head -n 1 "$CSV_PATH"
    echo "CSV first few rows:"
    head -n 5 "$CSV_PATH" | tail -n 4
else
    # If bucket exists, proceed with upload
    aws s3 cp "$CSV_PATH" "s3://$BUCKET_NAME/$DATA_FOLDER/forecast_data.csv"
    echo "CSV file uploaded successfully"
fi

# Create Athena table if it doesn't exist and if resources are deployed
echo "Checking Athena configuration..."

# SQL to create the table
CREATE_TABLE_SQL="
CREATE EXTERNAL TABLE IF NOT EXISTS $FORECAST_TABLE_NAME (
  restaurant_id INT,
  inventory_item_id INT,
  business_date DATE,
  dma_id STRING,
  dc_id INT,
  state STRING,
  y_05 DOUBLE,
  y_50 DOUBLE,
  y_95 DOUBLE
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
STORED AS TEXTFILE
LOCATION 's3://$BUCKET_NAME/$DATA_FOLDER/'
TBLPROPERTIES ('skip.header.line.count'='1');
"

# Create a temporary SQL file
TMP_SQL_FILE=$(mktemp)
echo "$CREATE_TABLE_SQL" > "$TMP_SQL_FILE"

# Check if Athena workgroup exists
if ! aws athena list-work-groups --query "WorkGroups[?Name=='$ATHENA_WORKGROUP']" --output text &> /dev/null; then
    echo "Warning: Athena workgroup $ATHENA_WORKGROUP does not exist yet."
    echo "This is expected if you haven't deployed the Terraform infrastructure."
    echo "When you deploy the infrastructure, you can run this script again."
    echo ""
    echo "Athena table configuration that will be applied after deployment:"
    echo "$CREATE_TABLE_SQL"
else
    echo "Creating Athena table: $FORECAST_TABLE_NAME in database $ATHENA_DATABASE"

    # Execute Athena query using AWS CLI
    QUERY_ID=$(aws athena start-query-execution \
        --query-string file://"$TMP_SQL_FILE" \
        --result-configuration OutputLocation="$ATHENA_OUTPUT_LOCATION" \
        --query-execution-context Database="$ATHENA_DATABASE" \
        --work-group "$ATHENA_WORKGROUP" \
        --output text)

    echo "Athena query started with ID: $QUERY_ID"
    echo "Waiting for query to complete..."

    # Wait for the query to complete
    STATUS="RUNNING"
    while [ "$STATUS" == "RUNNING" ] || [ "$STATUS" == "QUEUED" ]; do
        sleep 2
        STATUS=$(aws athena get-query-execution --query-execution-id "$QUERY_ID" --query "QueryExecution.Status.State" --output text)

        if [ "$STATUS" == "FAILED" ] || [ "$STATUS" == "CANCELLED" ]; then
            REASON=$(aws athena get-query-execution --query-execution-id "$QUERY_ID" --query "QueryExecution.Status.StateChangeReason" --output text)
            echo "Query failed: $REASON"
            exit 1
        fi
    done

    echo "Athena table created successfully with status: $STATUS"
fi

# Clean up
rm "$TMP_SQL_FILE"

echo "Forecast data validation and setup script completed."
echo "Note: Full functionality requires deploying the Terraform infrastructure first."
