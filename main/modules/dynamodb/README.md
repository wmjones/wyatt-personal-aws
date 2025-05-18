# DynamoDB Module

## Overview

This module creates and configures AWS DynamoDB tables for data storage in the D3 Visualization Dashboard and Productivity Workflow System. It provides a flexible, serverless NoSQL database solution with configurable capacity, indexes, and encryption settings.

## Components

- **DynamoDB Table**: NoSQL database table with configurable capacity modes
- **Global Secondary Indexes**: Support for additional query patterns
- **Local Secondary Indexes**: Additional sort keys for primary key querying
- **Auto-scaling**: (Optional) Auto-scaling configuration for on-demand capacity
- **Point-in-time Recovery**: Data backup and recovery options
- **Encryption**: Server-side encryption settings

## Variables

| Name | Description | Type | Required |
|------|-------------|------|----------|
| `table_name` | Name of the DynamoDB table | `string` | Yes |
| `billing_mode` | Billing mode for the table (PROVISIONED or PAY_PER_REQUEST) | `string` | No |
| `hash_key` | Hash key attribute name | `string` | Yes |
| `range_key` | Range key attribute name | `string` | No |
| `attributes` | List of attribute definitions | `list(map(string))` | Yes |
| `global_secondary_indexes` | Configurations for GSIs | `list(map(any))` | No |
| `local_secondary_indexes` | Configurations for LSIs | `list(map(any))` | No |
| `read_capacity` | Provisioned read capacity (if using PROVISIONED mode) | `number` | No |
| `write_capacity` | Provisioned write capacity (if using PROVISIONED mode) | `number` | No |
| `point_in_time_recovery_enabled` | Enable point-in-time recovery | `bool` | No |
| `stream_enabled` | Enable DynamoDB Streams | `bool` | No |
| `stream_view_type` | Stream view type if enabled | `string` | No |
| `tags` | Resource tags | `map(string)` | No |

## Outputs

| Name | Description |
|------|-------------|
| `table_id` | ID of the created DynamoDB table |
| `table_arn` | ARN of the DynamoDB table |
| `table_stream_arn` | ARN of the DynamoDB Stream (if enabled) |
| `table_stream_label` | Timestamp for the DynamoDB Stream (if enabled) |

## Integration with Project

The DynamoDB module serves as the primary data store for both components of the project:

### D3 Dashboard Integration
- **Visualization Storage**: Stores user visualization configurations and settings
- **User Data**: Stores user-specific dashboard data and preferences
- **Real-time Updates**: Enables real-time updates to dashboards via DynamoDB Streams

### Productivity Workflow Integration
- **Task Storage**: Stores task data from Todoist
- **Processing State**: Tracks the state of tasks through the enrichment pipeline
- **Integration Metadata**: Stores mapping data between different systems

The module is designed to work with the Lambda Function module, which contains the business logic for reading from and writing to DynamoDB tables.
