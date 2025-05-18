# Create a WAF Web ACL for CloudFront distributions
resource "aws_wafv2_web_acl" "cloudfront_waf" {
  provider = aws.us_east_1

  name        = "${var.project_name}-cloudfront-waf-${var.environment}"
  description = "WAF for CloudFront distribution"
  scope       = "CLOUDFRONT"

  # Ensure proper handling of CloudFront WAF associations during updates/deletions
  lifecycle {
    create_before_destroy = true
  }

  default_action {
    allow {}
  }

  # Add AWS managed rule set for common threats
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # AWS managed SQL injection rule set
  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "cloudfront-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Component   = "Security"
    Name        = "CloudFront WAF"
    Environment = var.environment
  }
}

# Output the WAF Web ACL ARN for use in other modules
output "cloudfront_waf_arn" {
  description = "ARN of the CloudFront WAF Web ACL"
  value       = aws_wafv2_web_acl.cloudfront_waf.arn
}
