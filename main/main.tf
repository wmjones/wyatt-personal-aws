terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
  required_version = ">= 1.6.0"
}

# Your resource declarations will go here

# SSM Parameters Module
module "ssm_parameters" {
  source = "./modules/ssm_parameters"

  project     = var.project_name
  environment = var.environment

  parameters = {
    api_gateway_url      = module.api_gateway.api_endpoint
    websocket_api_url    = aws_apigatewayv2_api.websocket.api_endpoint
    cognito_user_pool_id = module.cognito.user_pool_id
    cognito_client_id    = module.cognito.client_ids["${var.project_name}-web-client-${var.environment}"]
    cognito_region       = var.aws_region
    # Frontend parameters removed - React app deprecated in favor of Next.js on Vercel
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Keep any outputs you need
output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}
