# Lambda Function Module

## Overview

This module creates and configures AWS Lambda functions that power both the D3 Visualization Dashboard backend and the Productivity Workflow System. It provides a standardized approach to Lambda deployment with consistent permissions, monitoring, and integration capabilities.

## Components

- **Lambda Function**: Serverless function with configurable runtime, handler, and memory
- **IAM Role**: Role with appropriate permissions for function execution
- **CloudWatch Logs**: Log group for function monitoring and debugging
- **Function URL**: (Optional) HTTPS endpoint for direct function invocation
- **Environment Variables**: Runtime configuration variables
- **VPC Configuration**: (Optional) VPC connectivity for private resource access
- **Dead Letter Queue**: (Optional) Error handling for failed executions
- **Triggers**: Event sources that invoke the function

## Variables

| Name | Description | Type | Required |
|------|-------------|------|----------|
| `function_name` | Name of the Lambda function | `string` | Yes |
| `description` | Description of the function's purpose | `string` | No |
| `handler` | Function handler (e.g., index.handler) | `string` | Yes |
| `runtime` | Lambda runtime identifier (e.g., python3.9) | `string` | Yes |
| `source_path` | Path to function code | `string` | Yes |
| `memory_size` | Function memory allocation in MB | `number` | No |
| `timeout` | Function timeout in seconds | `number` | No |
| `environment_variables` | Map of environment variables | `map(string)` | No |
| `iam_policy_statements` | Additional IAM policy statements | `list(map(any))` | No |
| `vpc_config` | VPC configuration for the function | `map(any)` | No |
| `dead_letter_config` | Dead letter queue configuration | `map(string)` | No |
| `layers` | List of Lambda layer ARNs | `list(string)` | No |
| `publish` | Whether to publish a new version | `bool` | No |
| `tags` | Resource tags | `map(string)` | No |

## Outputs

| Name | Description |
|------|-------------|
| `function_arn` | ARN of the created Lambda function |
| `function_name` | Name of the Lambda function |
| `function_invoke_arn` | ARN for invoking the function (used for API Gateway) |
| `function_qualified_arn` | ARN with version (if published) |
| `role_arn` | ARN of the function's IAM role |
| `role_name` | Name of the function's IAM role |
| `log_group_name` | Name of the function's CloudWatch log group |
| `function_url` | URL for direct function invocation (if enabled) |

## Integration with Project

The Lambda Function module is the core processing component for both parts of the project:

### D3 Dashboard Integration
- **API Handlers**: Provides backend logic for API Gateway endpoints
- **Data Processing**: Manages reading and writing visualization data to DynamoDB
- **Authentication Flows**: Custom authentication workflows with Cognito

### Productivity Workflow Integration
- **Todoist Integration**: Fetches and updates tasks from Todoist
- **ChatGPT Processing**: Enriches task data using OpenAI's ChatGPT
- **Notion Integration**: Saves processed task data to Notion
- **Workflow Steps**: Individual steps orchestrated by Step Functions

This module is designed to work closely with the API Gateway module (for HTTP endpoints), the DynamoDB module (for data persistence), and the Step Function module (for workflow orchestration).
