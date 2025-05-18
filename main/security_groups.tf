# Security Groups for the D3 Dashboard & Productivity System

# Security Group for Lambda Functions
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg-${var.environment}"
  description = "Security group for Lambda functions"
  vpc_id      = module.vpc.vpc_id

  # No ingress rules - Lambda functions don't accept inbound connections

  # Allow outbound traffic to VPC resources
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [module.vpc.vpc_cidr_block]
    description = "Allow all outbound traffic within VPC"
  }

  # Allow HTTPS to AWS services via VPC endpoints
  egress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.vpc_endpoints.id]
    description     = "Allow HTTPS to AWS services via VPC endpoints"
  }

  # Allow DynamoDB access (for both visualization and productivity system)
  egress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    prefix_list_ids = [aws_vpc_endpoint.dynamodb.prefix_list_id]
    description     = "Allow access to DynamoDB"
  }

  # Allow S3 access (for static assets and data storage)
  egress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    prefix_list_ids = [aws_vpc_endpoint.s3.prefix_list_id]
    description     = "Allow access to S3"
  }

  # Allow HTTPS to specific external APIs
  egress {
    from_port = 443
    to_port   = 443
    protocol  = "tcp"
    cidr_blocks = [
      "35.174.132.182/32", # Todoist API
      "52.21.49.68/32",    # Todoist API alternative
      "3.5.140.5/32",      # OpenAI API
      "3.5.27.112/32",     # OpenAI API alternative
      "54.235.246.220/32", # Notion API
      "44.195.223.210/32"  # Notion API alternative
    ]
    description = "Allow HTTPS to specific external APIs for the productivity workflow"
  }

  tags = {
    Name        = "${var.project_name}-lambda-sg-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
    Component   = "Security"
  }
}

# Security Group for RDS (if we add a database in the future)
resource "aws_security_group" "database" {
  name        = "${var.project_name}-database-sg-${var.environment}"
  description = "Security group for database instances"
  vpc_id      = module.vpc.vpc_id

  # Allow inbound connections from Lambda functions
  ingress {
    from_port       = 5432 # PostgreSQL
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow PostgreSQL from Lambda functions"
  }

  # Allow outbound responses to Lambda functions only
  egress {
    from_port       = 1024
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow outbound responses to Lambda functions"
  }

  tags = {
    Name        = "${var.project_name}-database-sg-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
    Component   = "Security"
  }
}

# Security Group for ElastiCache (if we add Redis for WebSocket connections or caching)
resource "aws_security_group" "elasticache" {
  name        = "${var.project_name}-elasticache-sg-${var.environment}"
  description = "Security group for ElastiCache instances"
  vpc_id      = module.vpc.vpc_id

  # Allow inbound connections from Lambda functions
  ingress {
    from_port       = 6379 # Redis
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow Redis from Lambda functions"
  }

  # Allow outbound responses to Lambda functions only
  egress {
    from_port       = 1024
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow outbound responses to Lambda functions"
  }

  tags = {
    Name        = "${var.project_name}-elasticache-sg-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
    Component   = "Security"
  }
}

# Security Group for internal ALB (if we add one in the future)
resource "aws_security_group" "alb_internal" {
  name        = "${var.project_name}-alb-internal-sg-${var.environment}"
  description = "Security group for internal Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  # Allow HTTP/HTTPS from within VPC
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
    description = "Allow HTTP from within VPC"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
    description = "Allow HTTPS from within VPC"
  }

  # Allow outbound traffic to Lambda functions
  egress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow HTTPS to Lambda functions"
  }

  # Allow health check responses back to clients
  egress {
    from_port   = 1024
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
    description = "Allow responses back to clients within VPC"
  }

  tags = {
    Name        = "${var.project_name}-alb-internal-sg-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
    Component   = "Security"
  }
}
