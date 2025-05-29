# Forecast Data Sync Architecture

## Overview

This document describes the automated forecast data synchronization system that transfers data from S3/Athena to PostgreSQL (Neon) databases. The system is designed to be branch-aware, supporting multiple environments with automatic incremental syncs.

## Architecture Components

### 1. Data Flow

```
S3 Bucket (Forecast Data)
    ↓
AWS Athena (Query Engine)
    ↓
Lambda Function (Sync Logic)
    ↓
Neon PostgreSQL (Target Database)
```

### 2. Trigger Mechanisms

The sync process can be triggered through multiple mechanisms:

1. **S3 Event Notifications**: Automatically triggered when new forecast data is uploaded to S3
2. **GitHub Actions**: Triggered after successful deployments
3. **EventBridge Rules**: For scheduled syncs and custom event patterns
4. **Manual Invocation**: Direct Lambda invocation for testing or recovery

### 3. Core Components

#### Lambda Function (`forecast-sync-{environment}`)

**Purpose**: Executes the data synchronization logic

**Key Features**:
- Incremental sync support with timestamp tracking
- Branch-aware database connection management
- Batch processing for large datasets
- Comprehensive error handling and logging

**Environment Variables**:
- `ATHENA_DB_NAME`: Athena database name
- `ATHENA_OUTPUT_LOCATION`: S3 location for Athena query results
- `FORECAST_TABLE_NAME`: Source table name in Athena
- `NEON_API_KEY`: API key for Neon database management
- `NEON_PROJECT_ID`: Neon project identifier
- `DATABASE_URL`: Direct database connection string (optional)
- `AWS_REGION`: AWS region (default: us-east-2)
- `BATCH_SIZE`: Number of records to process per batch
- `ENVIRONMENT`: Current environment (dev/production)

#### S3 Event Configuration

**Bucket**: `{project_name}-datalake-{environment}-35315550`

**Event Types**: `s3:ObjectCreated:*`

**Filter**:
- Prefix: `forecast/`
- Suffix: `.parquet`

#### EventBridge Integration

**Rule Pattern**:
```json
{
  "source": ["aws.s3"],
  "detail-type": ["Object Created"],
  "detail": {
    "bucket": {
      "name": ["bucket-name"]
    },
    "object": {
      "key": [{
        "prefix": "forecast/"
      }]
    }
  }
}
```

#### GitHub Actions Workflow

**Workflow**: `.github/workflows/forecast-sync.yml`

**Triggers**:
- After successful Next.js deployments
- Manual workflow dispatch
- Scheduled (every 6 hours)

**Key Steps**:
1. Determine target environment and branch
2. Retrieve Neon database connection for branch
3. Execute sync via Lambda invocation
4. Report sync status

### 4. Database Schema

#### Forecast Data Table

```sql
CREATE TABLE forecast_data (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    inventory_item_id INTEGER NOT NULL,
    business_date DATE NOT NULL,
    dma_id VARCHAR(50),
    dc_id INTEGER,
    state VARCHAR(2) NOT NULL,
    y_05 DECIMAL(10, 2),
    y_50 DECIMAL(10, 2) NOT NULL,
    y_95 DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, inventory_item_id, business_date)
);
```

#### Sync Status Tracking

```sql
CREATE TABLE forecast_sync_status (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL,
    last_sync_timestamp TIMESTAMP NOT NULL,
    last_sync_date DATE,
    records_synced INTEGER,
    status VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Indexes for Performance

- `idx_forecast_business_date`: For date-based queries
- `idx_forecast_state`: For state filtering
- `idx_forecast_state_date`: Composite index for common queries
- `idx_forecast_dma`: For DMA filtering (partial index)
- `idx_forecast_dc`: For DC filtering (partial index)
- `idx_forecast_composite`: For complex filtering scenarios

### 5. Branch-Aware Environment Handling

The system automatically maps Git branches to appropriate AWS resources:

| Git Branch | Environment | AWS Resources | Neon Branch |
|------------|-------------|---------------|-------------|
| main | production | Production workspace | main |
| dev | dev | Dev workspace | dev |
| feature/* | dev | Dev workspace (shared) | dev |
| preview/pr-* | dev | Dev workspace | preview/pr-* |

### 6. Sync Types

#### Full Sync
- Processes all data from source
- Used for initial setup or recovery
- Replaces existing data with `ON CONFLICT` handling

#### Incremental Sync
- Only processes new data since last sync
- Uses `forecast_sync_status` table for tracking
- More efficient for regular updates

### 7. Error Handling and Monitoring

#### CloudWatch Alarms

1. **Lambda Error Alarm**
   - Threshold: 5 errors in 10 minutes
   - Action: SNS notification

2. **Lambda Duration Alarm**
   - Threshold: 10 minutes average duration
   - Action: SNS notification

#### Logging

All operations are logged to CloudWatch Logs:
- Log Group: `/aws/lambda/forecast-sync-{environment}`
- Retention: 30 days

#### Error Recovery

1. **Automatic Retry**: Lambda built-in retry mechanism (2 retries)
2. **Manual Recovery**: Use GitHub Actions workflow with manual trigger
3. **Full Resync**: Available as fallback option

### 8. Security Considerations

1. **IAM Permissions**: Least privilege access
   - S3: Read access to specific bucket/prefix
   - Athena: Query execution permissions
   - Secrets Manager: Access to database credentials
   - KMS: Decrypt permissions for encrypted data

2. **Network Security**
   - Lambda runs in VPC with appropriate security groups
   - Database connections use SSL/TLS
   - API keys stored in GitHub Secrets

3. **Data Encryption**
   - S3 data encrypted with KMS
   - Database connections encrypted in transit
   - Secrets encrypted at rest

### 9. Performance Optimization

1. **Batch Processing**: Configurable batch size (default: 10,000 records)
2. **Parallel Processing**: Athena queries run in parallel
3. **Index Usage**: Optimized indexes for common query patterns
4. **Connection Pooling**: Reused database connections within Lambda execution

### 10. Troubleshooting Guide

#### Common Issues

1. **Lambda Timeout**
   - Cause: Large data volume
   - Solution: Increase Lambda timeout or reduce batch size

2. **Athena Query Failure**
   - Cause: Schema mismatch or permissions
   - Solution: Verify table schema and IAM permissions

3. **Database Connection Failed**
   - Cause: Incorrect credentials or network issues
   - Solution: Check Neon branch exists and credentials are valid

4. **Duplicate Key Errors**
   - Cause: Concurrent syncs or data issues
   - Solution: Use incremental sync or verify data integrity

#### Debug Steps

1. Check CloudWatch Logs for error details
2. Verify S3 event notifications are configured
3. Test Lambda function with sample event
4. Validate Athena query separately
5. Check database connection and permissions

### 11. Maintenance Tasks

1. **Regular Tasks**
   - Monitor CloudWatch alarms
   - Review sync performance metrics
   - Clean up old sync status records

2. **Periodic Tasks**
   - Update Lambda function dependencies
   - Review and optimize Athena queries
   - Analyze index usage and performance

3. **As Needed**
   - Adjust batch sizes based on data volume
   - Update sync frequency
   - Add new indexes for query patterns

## Implementation Checklist

- [x] Lambda function implementation
- [x] S3 event notification configuration
- [x] EventBridge rule setup
- [x] GitHub Actions workflow
- [x] Database schema creation
- [x] IAM permissions configuration
- [x] CloudWatch monitoring setup
- [x] Unit tests for Lambda function
- [x] Documentation

## Future Enhancements

1. **Data Validation**: Add checksums or row count validation
2. **Parallel Processing**: Multi-threaded sync for large datasets
3. **Data Transformation**: Support for data transformation during sync
4. **Notification System**: Slack/Email notifications for sync status
5. **Dashboard**: Real-time sync monitoring dashboard
6. **API Endpoint**: REST API for sync status and manual triggers
