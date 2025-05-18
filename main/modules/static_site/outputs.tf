output "bucket_name" {
  description = "Name of the S3 bucket hosting the static website"
  value       = aws_s3_bucket.static_site.bucket
}

output "bucket_arn" {
  description = "ARN of the S3 bucket hosting the static website"
  value       = aws_s3_bucket.static_site.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_site.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_site.domain_name
}

output "website_url" {
  description = "URL of the website"
  value       = "https://${var.app_prefix}.${var.domain_name}"
}

output "acm_certificate_validation_options" {
  description = "DNS validation options for the ACM certificate"
  value       = aws_acm_certificate.cert.domain_validation_options
}
