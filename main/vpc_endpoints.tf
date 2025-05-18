# VPC Endpoints for AWS Services
# These endpoints allow services within the VPC to communicate with AWS services
# without traversing the public internet, improving security and performance.

# Security group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.project_name}-vpc-endpoints-sg-${var.environment}"
  description = "Security group for VPC endpoints"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }

  tags = {
    Name        = "${var.project_name}-vpc-endpoints-sg-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
    Component   = "Networking"
  }
}

# Gateway Endpoints (S3 and DynamoDB) - These are free and don't require ENIs
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(module.vpc.private_route_table_ids, module.vpc.public_route_table_ids)

  tags = {
    Name        = "${var.project_name}-s3-endpoint-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
    Component   = "Networking"
  }
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(module.vpc.private_route_table_ids, module.vpc.public_route_table_ids)

  tags = {
    Name        = "${var.project_name}-dynamodb-endpoint-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
    Component   = "Networking"
  }
}

# Interface Endpoints - These create ENIs in your subnet and incur hourly costs
# Only create these in production to reduce costs in dev environments
locals {
  create_interface_endpoints = var.create_interface_endpoints
  interface_endpoint_services = [
    "com.amazonaws.${var.aws_region}.lambda",
    "com.amazonaws.${var.aws_region}.apigateway",
    "com.amazonaws.${var.aws_region}.secretsmanager",
    "com.amazonaws.${var.aws_region}.cloudwatch",
    "com.amazonaws.${var.aws_region}.logs",
    "com.amazonaws.${var.aws_region}.events",
    "com.amazonaws.${var.aws_region}.ssm",
    "com.amazonaws.${var.aws_region}.ecr.api",
    "com.amazonaws.${var.aws_region}.ecr.dkr"
  ]
}

resource "aws_vpc_endpoint" "interface_endpoints" {
  for_each = local.create_interface_endpoints ? toset(local.interface_endpoint_services) : toset([])

  vpc_id              = module.vpc.vpc_id
  service_name        = each.value
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.vpc.private_subnets
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name        = "${var.project_name}-${split(".", each.value)[2]}-endpoint-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
    Component   = "Networking"
  }
}
