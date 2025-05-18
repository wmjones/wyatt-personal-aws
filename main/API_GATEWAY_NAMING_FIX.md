# API Gateway Naming Fix

## Problem
The API Gateway CloudWatch log group was using a static name `/aws/apigateway/dashboard-api` without including the environment variable. This causes conflicts when deploying to both dev and prod workspaces.

## Solution
Updated the API Gateway name to include both project name and environment variables:
- Before: `dashboard-api`
- After: `${var.project_name}-dashboard-api-${var.environment}`

## Result
The CloudWatch log group will now be created with environment-specific naming:
- Dev: `/aws/apigateway/wyatt-dashboard-api-dev`
- Prod: `/aws/apigateway/wyatt-dashboard-api-prod`

This prevents resource naming conflicts between environments and ensures proper log separation.

## Files Modified
- `/main/api_gateway.tf` - Updated API Gateway name to include environment variables
