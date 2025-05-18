# Testing the DynamoDB Infrastructure

This guide provides instructions for testing the DynamoDB tables and associated infrastructure after deployment.

## Overview

The D3 Dashboard uses three main DynamoDB tables:

1. **Parameter Table** - Stores visualization parameters
2. **History Table** - Tracks parameter change history
3. **Connection Table** - Manages WebSocket connections with TTL

## Prerequisites

- AWS CLI configured with appropriate credentials
- Deployed infrastructure (via Terraform)
- Basic familiarity with AWS DynamoDB and API Gateway

## Testing Steps

### 1. Verify Table Creation

First, verify that the tables have been created correctly:

```bash
# List all DynamoDB tables
aws dynamodb list-tables

# Describe the Parameter table
aws dynamodb describe-table --table-name <project-name>-parameters-<environment>

# Describe the History table
aws dynamodb describe-table --table-name <project-name>-parameter-history-<environment>

# Describe the Connection table
aws dynamodb describe-table --table-name <project-name>-connections-<environment>
```

Check that the tables have the correct keys, GSIs, and TTL settings.

### 2. Test the Parameter Table

Insert a test parameter record:

```bash
aws dynamodb put-item \
    --table-name <project-name>-parameters-<environment> \
    --item '{
        "paramId": {"S": "test-params"},
        "timestamp": {"N": "'$(date +%s%N | cut -b1-13)'"},
        "mean": {"N": "5"},
        "stdDev": {"N": "2"},
        "userId": {"S": "test-user"},
        "lastUpdatedBy": {"S": "test-script"},
        "lastUpdatedAt": {"N": "'$(date +%s%N | cut -b1-13)'"}
    }'
```

Query by paramId:

```bash
aws dynamodb query \
    --table-name <project-name>-parameters-<environment> \
    --key-condition-expression "paramId = :pid" \
    --expression-attribute-values '{":pid": {"S": "test-params"}}'
```

Query by userId using GSI:

```bash
aws dynamodb query \
    --table-name <project-name>-parameters-<environment> \
    --index-name UserIdIndex \
    --key-condition-expression "userId = :uid" \
    --expression-attribute-values '{":uid": {"S": "test-user"}}'
```

### 3. Test the History Table

Insert a test history record:

```bash
aws dynamodb put-item \
    --table-name <project-name>-parameter-history-<environment> \
    --item '{
        "userId": {"S": "test-user"},
        "timestamp": {"N": "'$(date +%s%N | cut -b1-13)'"},
        "paramName": {"S": "mean"},
        "paramId": {"S": "test-params"},
        "oldValue": {"N": "3"},
        "newValue": {"N": "5"},
        "userEmail": {"S": "test@example.com"}
    }'
```

Query by userId:

```bash
aws dynamodb query \
    --table-name <project-name>-parameter-history-<environment> \
    --key-condition-expression "userId = :uid" \
    --expression-attribute-values '{":uid": {"S": "test-user"}}'
```

Query by paramName using GSI:

```bash
aws dynamodb query \
    --table-name <project-name>-parameter-history-<environment> \
    --index-name ParamNameIndex \
    --key-condition-expression "paramName = :pname" \
    --expression-attribute-values '{":pname": {"S": "mean"}}'
```

Query by paramId using GSI:

```bash
aws dynamodb query \
    --table-name <project-name>-parameter-history-<environment> \
    --index-name ParamIdIndex \
    --key-condition-expression "paramId = :pid" \
    --expression-attribute-values '{":pid": {"S": "test-params"}}'
```

### 4. Test the Connection Table and TTL

Insert a test connection with TTL:

```bash
# Current time plus 5 minutes
TTL=$(( $(date +%s) + 300 ))

aws dynamodb put-item \
    --table-name <project-name>-connections-<environment> \
    --item '{
        "connectionId": {"S": "test-connection-'$RANDOM'"},
        "userId": {"S": "test-user"},
        "connectedAt": {"N": "'$(date +%s%N | cut -b1-13)'"},
        "expiry": {"N": "'$TTL'"},
        "connectionStatus": {"S": "connected"},
        "clientIp": {"S": "127.0.0.1"}
    }'
```

Verify TTL is enabled:

```bash
aws dynamodb describe-time-to-live \
    --table-name <project-name>-connections-<environment>
```

Query by connectionId:

```bash
aws dynamodb query \
    --table-name <project-name>-connections-<environment> \
    --key-condition-expression "connectionId = :cid" \
    --expression-attribute-values '{":cid": {"S": "test-connection-ID"}}'
```

Query by userId using GSI:

```bash
aws dynamodb query \
    --table-name <project-name>-connections-<environment> \
    --index-name UserConnectionsIndex \
    --key-condition-expression "userId = :uid" \
    --expression-attribute-values '{":uid": {"S": "test-user"}}'
```

### 5. Test API Integration

Test the Lambda functions and API Gateway:

1. Go to the deployed static site
2. Navigate to the demo page (`/demo.html`)
3. Use the interface to:
   - Connect to the WebSocket
   - Update visualization parameters
   - Verify changes are reflected in the UI
   - Check WebSocket real-time updates

### 6. Check CloudWatch Logs

Monitor the function executions:

```bash
# Get the log group names
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/viz

# Get log events (replace with your log group name)
aws logs get-log-events --log-group-name /aws/lambda/viz-get-dev --log-stream-name <stream-name>
```

Review logs for any errors or unexpected behavior.

## Troubleshooting

### Common Issues

1. **Permission errors**: Verify IAM roles and policies for Lambda functions
2. **Failed DynamoDB operations**: Check provisioned throughput or on-demand capacity
3. **TTL not working**: TTL deletions are eventually consistent (can take up to 48 hours)
4. **WebSocket connection issues**: Check API Gateway configuration and route settings

### AWS Console

For more detailed debugging, you can use the AWS Console to:

- View DynamoDB tables and run queries
- Monitor Lambda function execution in CloudWatch
- Check API Gateway logs and test endpoints
- Verify WebSocket API routes

## Clean Up

After testing, you can clean up test data:

```bash
# Remove test parameter
aws dynamodb delete-item \
    --table-name <project-name>-parameters-<environment> \
    --key '{"paramId": {"S": "test-params"}, "timestamp": {"N": "TIMESTAMP-VALUE"}}'

# Remove test history entries
aws dynamodb delete-item \
    --table-name <project-name>-parameter-history-<environment> \
    --key '{"userId": {"S": "test-user"}, "timestamp": {"N": "TIMESTAMP-VALUE"}}'

# Remove test connections
aws dynamodb delete-item \
    --table-name <project-name>-connections-<environment> \
    --key '{"connectionId": {"S": "test-connection-ID"}}'
```

## Next Steps

Once you've verified that the DynamoDB infrastructure is working correctly, you can:

1. Integrate with the full React frontend application
2. Implement proper user authentication with Cognito
3. Enhance the visualization capabilities with more D3.js features
4. Add additional data processing Lambda functions
