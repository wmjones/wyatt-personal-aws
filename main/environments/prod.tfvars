# Production Environment Configuration

# Basic Information
environment           = "prod"
aws_region            = "us-east-2"
project_name          = "wyatt-personal-aws"
domain_name           = "example.com" # Replace with your actual domain name
app_prefix            = "app"
cognito_domain_prefix = "wyatt-personal-aws"

# Network Configuration
vpc_cidr = "10.0.0.0/16"
# NAT Gateway Configuration
single_nat_gateway     = true
one_nat_gateway_per_az = false
# Skip interface endpoints in prod to reduce costs (shared NAT Gateway approach)
create_interface_endpoints = false

# Cognito Configuration
cognito_deletion_protection = true

# DynamoDB Configuration
dynamodb_billing_mode           = "PAY_PER_REQUEST"
dynamodb_point_in_time_recovery = true

# Lambda Configuration
lambda_runtime = "python3.10"

# WebSocket API Configuration
websocket_api_name = "dashboard-websocket-prod"

# Vercel Configuration
vercel_app_url = "" # Will be populated during Vercel deployment

# Step Function Configuration
step_function_name = "todoist-workflow-prod"

# Security Group Names
lambda_sg_name      = "lambda-security-group-prod"
database_sg_name    = "database-security-group-prod"
elasticache_sg_name = "elasticache-security-group-prod"
alb_sg_name         = "alb-security-group-prod"

# EventBridge Configuration
eventbridge_rule_name = "todoist-workflow-rule-prod"
