# Database Seeding System with Amazon Athena and S3 Integration

This document provides an overview of the database seeding system that integrates Amazon Athena, S3, and the Next.js application.

## System Architecture

```
+-----------------------------------------+
|                                         |
|          Next.js Application            |
|  +----------------+  +----------------+ |
|  |   Athena API   |  |  Frontend UI   | |
|  |  Endpoints     |  |  Components    | |
|  +-------+--------+  +-------+--------+ |
|          |                   |          |
+----------+-------------------+----------+
           |                   |
           v                   v
+----------+-------------------+----------+
|                                         |
|              AWS API Gateway            |
|                                         |
+--------------------+--------------------+
                     |
                     v
+--------------------+--------------------+
|                                         |
|            Lambda Functions             |
|                                         |
+----+----------------------+-------------+
     |                      |
     v                      v
+----+------+       +------+-----+
|           |       |            |
|  Amazon   |       |  Amazon    |
|  Athena   +------>+  S3        |
|           |       |            |
+-----------+       +------------+
```

## Components Overview

### 1. Amazon S3 Configuration

- The system uses the existing data lake bucket (`wyatt-datalake-35315550`) to store the forecast data
- A separate bucket for Athena query results is configured
- The data is organized in the `forecast_data` folder within the bucket

### 2. Amazon Athena Configuration

- An Athena database named `forecast_data_${environment}` is configured
- A `forecast` table is defined that maps to the CSV structure in S3
- A dedicated Athena workgroup is created for forecast analysis
- Query results are stored in a separate results bucket

### 3. API Integration

- Lambda function for executing Athena queries on the forecast data
- API Gateway endpoints exposing the Lambda functionality
- Next.js API routes that proxy to the AWS backend

### 4. Frontend Components

- React components for visualizing the forecast data
- Custom hook (`useAthenaQuery`) for interacting with the Athena API
- Dashboard page displaying forecast summaries and trends

## Data Flow

1. CSV data is uploaded to S3 using AWS CLI
2. Athena tables are created to query the data in S3
3. Lambda functions execute Athena queries and return results
4. Next.js API routes forward requests to the Lambda functions
5. React components consume and visualize the data

## Implementation Details

### S3 Data Storage

- The forecast data CSV is stored in the S3 bucket as `/forecast_data/forecast_data.csv`
- The data includes restaurant and inventory forecasts with historical dates
- Fields include: restaurant_id, inventory_item_id, business_date, dma_id, dc_id, state, y_05, y_50, y_95

### Athena Table Schema

```sql
CREATE EXTERNAL TABLE forecast (
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
LOCATION 's3://{BUCKET_NAME}/forecast_data/'
TBLPROPERTIES ('skip.header.line.count'='1');
```

### Lambda Function

The Lambda function provides several API operations:

- `execute_query`: Execute a custom Athena SQL query
- `get_forecast_summary`: Generate a summary of forecast data by state
- `get_forecast_by_date`: Retrieve forecast data for a specific date range

### Next.js Integration

- API routes in `/api/data/athena` proxy requests to AWS
- Utility functions in `lib/athena.ts` provide a clean interface
- React hook `useAthenaQuery` manages state and data fetching

## Security Considerations

- IAM roles with least privilege principles for S3 and Athena access
- API Gateway authorization through Cognito
- Encryption at rest for S3 data and Athena query results
- Private S3 buckets with no public access

## Setup and Usage

### Prerequisites

- AWS credentials configured
- S3 bucket created
- Terraform applied to create Athena resources

### Upload Script

To upload the forecast data to S3 and create the Athena table, use the provided shell script:

```bash
cd src/scripts
./seed-database.sh
```

Alternatively, you can use AWS CLI directly:

```bash
# Upload the CSV file
aws s3 cp /workspaces/wyatt-personal-aws/data/forecast_data.csv s3://wyatt-personal-aws-datalake-dev-35315550/forecast_data/

# Create the Athena table (using the appropriate query execution command)
```

### Testing

Run the test suite to verify the system:

```bash
cd src/tests
npm test
```

## Extending the System

### Adding New Data Sources

1. Upload data files to the S3 bucket in a new folder using AWS CLI:
   ```bash
   aws s3 cp /path/to/data s3://bucket-name/folder-name/
   ```

2. Create a new Athena table definition mapping to the data
3. Add new query functions to the Lambda function
4. Create corresponding API endpoints and React components

### Creating Visualizations

The system supports various visualization types:

- Time series charts for forecast trends
- Summary tables for aggregate statistics
- State-specific filtering and comparison
- Date range analysis

## Troubleshooting

### Common Issues

- **S3 Upload Failures**: Check AWS credentials and bucket permissions
- **Athena Query Errors**: Verify table schema matches CSV format
- **API Connection Issues**: Ensure CORS is configured properly
- **Visualization Problems**: Check browser console for errors

### Query Performance Optimization

- Partition data by date or state for faster queries
- Use Athena workgroups to manage query concurrency
- Consider converting data to Parquet format for better performance
- Add proper indexes and partitioning to the Athena tables

## Future Enhancements

- Add support for real-time data ingestion
- Implement more advanced analytics with machine learning
- Create admin interface for managing data sources
- Add scheduled data refresh capabilities
- Support custom visualization creation by users
