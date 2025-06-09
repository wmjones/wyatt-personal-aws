# Athena to Neon Manual ETL Pipeline

This document describes the manual ETL pipeline for syncing data from AWS Athena to Neon Postgres branches.

## Overview

The manual ETL pipeline allows on-demand data synchronization from AWS Athena to Neon Postgres with support for:
- Full data sync to any Neon branch
- Schema-only sync for development environments
- Test data generation for isolated testing
- Date range and table filtering
- Comprehensive validation and reporting

## Architecture

```
AWS Athena → Manual ETL Process → Neon Postgres Branch
     ↓              ↓                      ↓
[S3 Data Lake] [GitHub Actions]    [Main/Feature Branch]
```

## Usage

### Via GitHub Actions UI

1. Navigate to **Actions** → **Manual Athena to Neon ETL**
2. Click **Run workflow**
3. Configure parameters:
   - **Target Branch**: Neon branch name (leave empty for main)
   - **Data Mode**: Choose sync strategy
   - **Table Filter**: Specific tables/states to sync
   - **Date Range**: Number of days to sync (0 for all)

### Workflow Parameters

| Parameter | Description | Options | Default |
|-----------|-------------|---------|---------|
| `target_branch` | Target Neon branch | Branch name or empty | main |
| `data_mode` | Data synchronization mode | `full`, `schema-only`, `test-data` | full |
| `table_filter` | Filter specific tables | Comma-separated list | All tables |
| `date_range_days` | Days of data to sync | Number (0 for all) | 0 |

## Data Modes

### Full Mode
- Syncs all data from Athena to target branch
- Creates all indexes for optimal performance
- Suitable for production-like environments

### Schema-Only Mode
- Creates table structure without data
- Minimal indexes for faster setup
- Ideal for initial development setup

### Test Data Mode
- Creates schema with test-specific columns
- Generates synthetic test data
- Includes test scenario tracking
- Perfect for isolated testing

## ETL Process Steps

1. **Configuration Loading**
   - Reads workflow inputs
   - Determines target branch connection
   - Validates parameters

2. **Schema Creation**
   - Creates tables based on data mode
   - Applies appropriate indexes
   - Sets up constraints

3. **Data Synchronization**
   - Queries Athena based on filters
   - Transfers data in batches
   - Handles conflicts with UPSERT

4. **Validation**
   - Verifies table existence
   - Checks record counts
   - Validates data integrity
   - Tests query performance

5. **Reporting**
   - Generates execution summary
   - Logs validation results
   - Creates artifacts for review

## Validation Checks

The ETL pipeline includes comprehensive validation:

- **Table Existence**: Verifies forecast_data table exists
- **Record Count**: Ensures data was transferred
- **Schema Validation**: Checks all required columns
- **Data Integrity**: Validates nulls, duplicates, and constraints
- **Date Range**: Confirms expected date coverage
- **Index Verification**: Ensures critical indexes exist
- **Performance Metrics**: Tests sample query performance

## Manual Execution

### Direct Script Execution

```bash
# Set environment variables
export NEON_CONNECTION_STRING="postgresql://..."
export ATHENA_DB_NAME="default"
export ATHENA_OUTPUT_LOCATION="s3://..."
export AWS_REGION="us-east-1"

# Run ETL
cd scripts
npm install
npm run etl:manual

# Run validation
npm run validate:etl
```

### Configuration File

Create `scripts/etl-config.json`:

```json
{
  "targetBranch": "feature/new-dashboard",
  "dataMode": "full",
  "tableFilter": "CA,TX",
  "dateRangeDays": 30,
  "connectionString": "postgresql://..."
}
```

## Branch Management

### Creating a Branch for ETL

```bash
# Using Neon CLI
neonctl branches create \
  --project-id $NEON_PROJECT_ID \
  --name "etl-test-branch" \
  --parent "main"

# Get connection string
neonctl connection-string \
  --project-id $NEON_PROJECT_ID \
  --branch "etl-test-branch"
```

### Branch Lifecycle

1. **Create**: Manual or automated branch creation
2. **Sync**: Run ETL to populate with data
3. **Use**: Connect applications to branch
4. **Clean**: Delete when no longer needed

## Monitoring and Troubleshooting

### Workflow Artifacts

Each ETL run produces:
- `etl-manual.log`: Detailed execution log
- `etl-report.json`: Execution summary
- `etl-validation-report.json`: Validation results

### Common Issues

1. **Branch Not Found**
   - Verify branch exists in Neon console
   - Check branch name spelling
   - Ensure API key has access

2. **Athena Query Timeout**
   - Reduce date range or table filter
   - Check Athena query complexity
   - Verify S3 permissions

3. **Validation Failures**
   - Review validation report
   - Check data integrity issues
   - Verify schema compatibility

### Performance Optimization

- **Batch Size**: Adjust batch size in script for large datasets
- **Indexes**: Create indexes after bulk load for faster import
- **Parallel Processing**: Consider multiple concurrent ETL jobs
- **Incremental Sync**: Use date ranges to sync only new data

## Security Considerations

- **Credentials**: Never commit connection strings
- **Data Access**: Use appropriate IAM roles
- **Branch Isolation**: Ensure proper access controls
- **Sensitive Data**: Use schema-only or test-data modes

## Best Practices

1. **Test First**: Always test with a small date range
2. **Monitor Progress**: Check GitHub Actions logs
3. **Validate Results**: Review validation reports
4. **Clean Up**: Delete temporary branches
5. **Document Changes**: Update this guide as needed

## Future Enhancements

- [ ] Incremental sync support
- [ ] Parallel table processing
- [ ] Data transformation options
- [ ] Automated scheduling
- [ ] Slack notifications
- [ ] Data quality metrics
