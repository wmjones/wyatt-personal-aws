# Terraform Modules

## Overview

This project follows a "modules first" approach to infrastructure as code, using reusable Terraform modules for all AWS resources. The project is organized into the following modules:

## 1. API Gateway Module

**Purpose**: Creates and configures HTTP API Gateway endpoints

**Key Components**:
- HTTP API Gateway with routes
- CORS configuration
- Lambda integrations
- Authorization with Cognito

**Usage**: Provides RESTful API endpoints for the frontend to interact with backend Lambda functions

## 2. Cognito Module

**Purpose**: Manages user authentication and authorization

**Key Components**:
- User pools with configured password policies
- App clients for frontend integration
- Identity pools for AWS resource access
- User groups and permissions

**Usage**: Handles user registration, login, and access control for the application

## 3. DynamoDB Module

**Purpose**: Configures NoSQL database tables for data storage

**Key Components**:
- DynamoDB tables with configurable capacity
- Global secondary indexes
- Point-in-time recovery
- TTL configuration

**Usage**: Stores visualization parameters, user preferences, task data, and connection information

## 4. Frontend Module (Deprecated)

**Purpose**: Previously used for hosting React SPA - now deprecated in favor of Vercel hosting

**Status**: Removed - Frontend is now hosted on Vercel with Next.js

## 5. Lambda Function Module

**Purpose**: Deploys serverless functions with appropriate permissions

**Key Components**:
- Lambda functions with configurable runtime
- IAM roles and policies
- Environment variables
- CloudWatch logging

**Usage**: Provides the serverless compute for both application components

## 6. Static Site Module

**Purpose**: Provides simpler static website hosting for documentation

**Key Components**:
- S3 bucket with website configuration
- Optional custom domain configuration
- Route 53 DNS configuration (optional)

**Usage**: Hosts documentation and other static content

## 7. Step Function Module

**Purpose**: Orchestrates multi-step workflows

**Key Components**:
- Step Function state machine
- IAM roles and permissions
- Lambda function integrations
- Error handling configurations

**Usage**: Orchestrates the Productivity Workflow System automation steps

## Module Interactions

These modules work together to create the complete infrastructure:

- **Frontend** communicates with **API Gateway** to access backend functionality
- **API Gateway** routes requests to **Lambda Functions** for processing
- **Lambda Functions** read from and write to **DynamoDB** for data persistence
- **Cognito** validates user credentials for both the **Frontend** and **API Gateway**
- **Step Functions** orchestrates multiple **Lambda Functions** for workflow automation
- **Static Site** provides documentation and supplementary content
