# Frontend configuration - uses the us-east-1 provider defined in provider.tf

# Create a CloudFront function for URL rewrites if needed
locals {
  cloudfront_function_code = <<EOF
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Handle routes for single page application
    if (!uri.includes('.') && !uri.startsWith('/api/')) {
        request.uri = '/index.html';
    }

    return request;
}
EOF
}

module "frontend" {
  source = "./modules/frontend"

  environment = var.environment
  bucket_name = "${lower(var.project_name)}-app-${var.environment}-${random_id.bucket_suffix.hex}"
  domain_name = var.domain_name
  app_prefix  = var.app_prefix

  # Control certificate validation behavior
  create_dns_records = false # Set to true if you want to automate DNS validation via Route53
  use_default_cert   = true  # Set to false once you've validated your certificate manually

  # Enable single page application behavior
  single_page_application = true

  # Add API Gateway integration
  api_gateway_endpoint      = module.api_gateway.api_endpoint
  enable_api_cache_behavior = true
  api_path_pattern          = "/api/*"

  # Add CloudFront function for URL rewrites
  cloudfront_function_code = local.cloudfront_function_code

  # Add WAF protection
  web_acl_id = aws_wafv2_web_acl.cloudfront_waf.arn

  # Use KMS key for encryption
  kms_key_arn = aws_kms_key.s3_key.arn

  # React app build directory for deployment
  # When deploying manually, leave as null and use deploy_react_app.sh script
  react_app_build_dir = null # Set to the build directory path when using Terraform for deployment

  tags = {
    Component   = "Frontend"
    Environment = var.environment
  }

  providers = {
    aws           = aws           # default provider
    aws.us_east_2 = aws.us_east_2 # pass the alias through
  }
}
