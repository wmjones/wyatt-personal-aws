# Network Infrastructure Outputs

# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

# vpc_cidr_block output is already defined in main.tf

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "private_subnet_cidrs" {
  description = "List of CIDR blocks of private subnets"
  value       = module.vpc.private_subnets_cidr_blocks
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "public_subnet_cidrs" {
  description = "List of CIDR blocks of public subnets"
  value       = module.vpc.public_subnets_cidr_blocks
}

output "nat_public_ips" {
  description = "List of public Elastic IPs created for AWS NAT Gateway"
  value       = module.vpc.nat_public_ips
}

# Security Group Outputs
output "lambda_security_group_id" {
  description = "ID of the security group for Lambda functions"
  value       = aws_security_group.lambda.id
}

output "database_security_group_id" {
  description = "ID of the security group for database instances"
  value       = aws_security_group.database.id
}

output "elasticache_security_group_id" {
  description = "ID of the security group for ElastiCache instances"
  value       = aws_security_group.elasticache.id
}

output "internal_alb_security_group_id" {
  description = "ID of the security group for internal ALB"
  value       = aws_security_group.alb_internal.id
}

output "vpc_endpoints_security_group_id" {
  description = "ID of the security group for VPC endpoints"
  value       = aws_security_group.vpc_endpoints.id
}

# VPC Endpoint Outputs
output "s3_vpc_endpoint_id" {
  description = "ID of the S3 VPC Endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "dynamodb_vpc_endpoint_id" {
  description = "ID of the DynamoDB VPC Endpoint"
  value       = aws_vpc_endpoint.dynamodb.id
}

output "interface_vpc_endpoints" {
  description = "Map of interface VPC endpoints created"
  value       = local.create_interface_endpoints ? { for k, v in aws_vpc_endpoint.interface_endpoints : k => v.id } : {}
}
