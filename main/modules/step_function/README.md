# Step Function Module

## Overview

This module creates and configures AWS Step Functions state machines for workflow orchestration in the Productivity Workflow System. It provides a serverless workflow engine that coordinates multiple Lambda functions and services to create complex, multi-step processes.

## Components

- **State Machine**: Defines the workflow steps and logic
- **IAM Role**: Permissions for the state machine to invoke other AWS services
- **Logging Configuration**: CloudWatch logging for workflow execution
- **X-Ray Tracing**: (Optional) Distributed tracing for performance analysis
- **Error Handling**: Retry and catch mechanisms for fault tolerance

## Variables

| Name | Description | Type | Required |
|------|-------------|------|----------|
| `name` | Name of the state machine | `string` | Yes |
| `definition` | JSON or YAML definition of the state machine | `string` | Yes |
| `type` | Type of state machine (STANDARD or EXPRESS) | `string` | No |
| `logging_configuration` | Configuration for CloudWatch logging | `map(any)` | No |
| `role_arn` | ARN of IAM role for the state machine | `string` | Yes |
| `tracing_configuration` | X-Ray tracing configuration | `map(any)` | No |
| `publish` | Whether to publish a new version | `bool` | No |
| `tags` | Resource tags | `map(string)` | No |

## Outputs

| Name | Description |
|------|-------------|
| `state_machine_id` | ID of the created state machine |
| `state_machine_arn` | ARN of the state machine |
| `state_machine_name` | Name of the state machine |
| `state_machine_creation_date` | Creation date of the state machine |
| `state_machine_status` | Current status of the state machine |

## Integration with Project

The Step Function module is the orchestration layer for the Productivity Workflow System:

- **Task Coordination**: Coordinates the end-to-end task enrichment workflow
- **Error Recovery**: Manages retries and failure handling for robust operation
- **Parallel Processing**: Enables parallel processing of tasks when appropriate
- **State Management**: Tracks the state of tasks through the enrichment pipeline

The workflow typically follows this sequence:
1. Get tasks from Todoist (Lambda function)
2. Process tasks with ChatGPT (Lambda function)
3. Save processed data to Notion (Lambda function)
4. Update task status in Todoist (Lambda function)

This module works closely with the Lambda Function module, which provides the individual steps in the workflow, and the EventBridge module, which can trigger the workflow on a schedule.
