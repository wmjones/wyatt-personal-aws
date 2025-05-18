# Productivity Workflow System

## Overview

The Productivity Workflow System is an automated pipeline that integrates Todoist tasks with ChatGPT and Notion for task enrichment and organization. The system fetches tasks from Todoist, processes them with ChatGPT to add context and suggestions, and then saves the enriched tasks to Notion for organization and reference.

## Features

- **Todoist Integration**: Fetch tasks and to-do lists from Todoist API
- **ChatGPT Processing**: Enrich tasks with additional context and recommendations using OpenAI's API
- **Notion Integration**: Store and organize enriched tasks in Notion databases
- **Automated Workflow**: Scheduled execution of the complete pipeline
- **Error Handling**: Robust error handling and recovery mechanisms

## Architecture Components

- **Step Functions**: Orchestrates the entire workflow
- **Lambda Functions**: Serverless functions for each step of the process:
  - getTodoist.py: Fetches tasks from Todoist
  - putChatGPT.py: Processes tasks with ChatGPT
  - putNotion.py: Stores enriched tasks in Notion
- **EventBridge**: Scheduled execution of the workflow
- **S3**: Data storage for task information
- **External APIs**: Integration with Todoist, ChatGPT, and Notion

## Implementation Status

The Productivity Workflow System includes these implemented components:

1. **Lambda Functions**:
   - getTodoist.py
   - putChatGPT.py
   - putNotion.py
   - utils.py (shared utilities)

2. **Step Function**:
   - Workflow definition for orchestrating the process

3. **EventBridge**:
   - Rule for scheduled execution

## Configuration Requirements

- **Todoist API Key**: For accessing and managing tasks
- **OpenAI API Key**: For ChatGPT integration
- **Notion API Key**: For accessing and updating Notion databases

## Next Steps

1. Enhance error handling and retry logic
2. Add more advanced filtering options for tasks
3. Implement user configuration interface
4. Add monitoring and notification capabilities
