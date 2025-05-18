module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-vpc-${var.environment}"
  cidr = var.vpc_cidr

  # Use 3 AZs for high availability
  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  # DNS Settings
  enable_dns_hostnames = true
  enable_dns_support   = true

  # NAT Gateway for private subnet internet access
  enable_nat_gateway     = true
  single_nat_gateway     = var.single_nat_gateway
  one_nat_gateway_per_az = var.one_nat_gateway_per_az

  # IPv6 settings
  enable_ipv6 = false

  # VPC Flow Logs
  enable_flow_log                      = true
  create_flow_log_cloudwatch_log_group = true
  create_flow_log_cloudwatch_iam_role  = true
  flow_log_max_aggregation_interval    = 60

  # Default security group with no ingress/egress
  manage_default_security_group  = true
  default_security_group_ingress = []
  default_security_group_egress  = []

  # Resource tags
  tags = {
    Environment = var.environment
    Name        = "${var.project_name}-vpc-${var.environment}"
    Terraform   = "true"
    Component   = "Networking"
  }

  # Subnet tags for Kubernetes (if needed in the future)
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }
}
