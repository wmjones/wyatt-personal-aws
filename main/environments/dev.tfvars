# Development Environment Configuration

# Basic Information
environment           = "dev"
aws_region            = "us-east-2"
project_name          = "wyatt-personal-aws"
domain_name           = "example.com" # Replace with your actual domain name or use Vercel domain
app_prefix            = "app-dev"
cognito_domain_prefix = "wyatt-personal-dev"

# Network Configuration
vpc_cidr = "10.0.0.0/16"
# NAT Gateway Configuration
single_nat_gateway     = true
one_nat_gateway_per_az = false
# Skip interface endpoints in dev to reduce costs
create_interface_endpoints = false

# Cognito Configuration
cognito_deletion_protection = false

# Vercel Configuration
vercel_app_url = "" # Will be populated during Vercel deployment

# DynamoDB Configuration
dynamodb_billing_mode           = "PAY_PER_REQUEST"
dynamodb_point_in_time_recovery = false

# Lambda Configuration
lambda_runtime = "python3.10"

# WebSocket API Configuration
websocket_api_name = "dashboard-websocket-dev"

# Step Function Configuration
step_function_name = "todoist-workflow-dev"

# Security Group Names
lambda_sg_name      = "lambda-security-group-dev"
database_sg_name    = "database-security-group-dev"
elasticache_sg_name = "elasticache-security-group-dev"
alb_sg_name         = "alb-security-group-dev"

# EventBridge Configuration
eventbridge_rule_name = "todoist-workflow-rule-dev"
