# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# D3 Dashboard & Productivity System

## Project Overview

This project consists of two distinct but related serverless applications:

1. **Interactive D3 Visualization Dashboard**: A dynamic web application that allows users to view and modify data visualizations built with D3.js. The application features user authentication, private data storage, and interactive visualization editing capabilities.

2. **Productivity Workflow System**: An automated pipeline that integrates Todoist tasks with ChatGPT and Notion for task enrichment and organization.

## Architecture Principles

### Terraform Modules First Approach

This project follows a "modules first" approach to infrastructure as code:

- **Use Community Modules**: We leverage the `terraform-aws-modules` collection wherever possible to reduce boilerplate code and follow established best practices.
- **DRY Infrastructure**: By using modules, we avoid repetitive configuration and ensure consistency across resources.
- **Maintainability**: Modules abstract away complex resource relationships and make the codebase easier to understand and maintain.
- **Versioning**: All modules are pinned to specific versions to ensure deployment stability.

### Serverless Architecture

The entire system is built on serverless components:

- **Zero Server Management**: No EC2 instances or containers to maintain
- **Cost Efficiency**: Pay-per-use pricing model with minimal costs during low-usage periods
- **Automatic Scaling**: Resources scale automatically with demand
- **High Availability**: Built-in redundancy across availability zones

## Project Documentation

Each module in the project has its own README.md that details:
- Components and purpose of the module
- Variables accepted by the module
- Outputs provided by the module
- How the module integrates with the overall project

## D3 Dashboard Components

The visualization dashboard consists of:

### Frontend
- **React SPA**: Single-page application built with React and TypeScript
- **D3.js Integration**: Interactive data visualizations with drag-and-drop editing
- **Authentication**: AWS Cognito for user management and JWT-based authentication
- **Deployment**: Static assets in S3 delivered through CloudFront CDN

### Backend
- **API Gateway**: HTTP API with JWT authorization
- **Lambda Functions**: Python-based serverless functions for data operations
- **DynamoDB**: NoSQL database for user data storage
- **Cognito User Pools**: User authentication and authorization

## Productivity System Components

The Todoist integration workflow includes:

- **Step Functions**: Orchestrates the entire workflow
- **Lambda Functions**: Serverless functions for each step of the process
- **EventBridge**: Scheduled execution of the workflow
- **S3**: Data storage for task information
- **External APIs**: Integration with Todoist, ChatGPT, and Notion

## Module Structure

The project is organized into reusable Terraform modules:

1. **api_gateway**: Creates and configures HTTP API Gateway endpoints
2. **cognito**: Manages user authentication and authorization
3. **dynamodb**: Configures NoSQL database tables for data storage
4. **frontend**: Sets up S3 and CloudFront for hosting the SPA
5. **lambda_function**: Deploys serverless functions with appropriate permissions
6. **static_site**: Provides simpler static website hosting for documentation
7. **step_function**: Orchestrates multi-step workflows for the productivity system

## Key Terraform Modules Used

This project leverages several key modules from the terraform-aws-modules collection:

- **VPC**: Network configuration
- **Lambda**: Serverless compute functions
- **DynamoDB**: NoSQL database tables
- **S3**: Object storage buckets
- **CloudFront**: Content delivery network
- **API Gateway v2**: HTTP API endpoints
- **Cognito**: User authentication
- **Step Functions**: Workflow orchestration
- **EventBridge**: Event scheduler
- **IAM**: Identity and access management

## Getting Started

### Prerequisites

- AWS Account
- Terraform (v1.6.0+)
  - deployed using API calls for terraform cloud
- Domain name for the application
- API keys for Todoist, OpenAI, and Notion (for productivity system)

### Deployment Process

1. Clone the repository
2. Configure AWS credentials
3. Update `terraform.auto.tfvars` with your configuration values
4. Run `terraform init` to initialize the working directory
5. Run `terraform plan` to preview changes
6. Run `terraform apply` to deploy the infrastructure

## Reusable commands

- pre-commit run --all-files > precommit.log 2>&1
- READ CLAUDE.md, phase2.md, phase2_1.md, ai_docs/*
- Run git ls-files to understand this codebase
- Can you please initialize taskmaster-ai into my project?
- https://github.com/eyaltoledano/claude-task-master/blob/main/docs/tutorial.md
