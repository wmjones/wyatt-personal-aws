# Static Site Module

## Overview

This module creates and configures a static website hosting infrastructure for simple, non-interactive content. While the Frontend module is optimized for single-page applications like the D3 Dashboard, this module provides a streamlined solution for hosting static documentation, landing pages, or simple websites.

## Components

- **S3 Bucket**: Hosts static website files
- **CloudFront Distribution**: CDN for global content delivery
- **ACM Certificate**: SSL/TLS certificate for HTTPS
- **DNS Configuration**: Route 53 records for custom domains
- **Bucket Policy**: Access policy for S3 bucket
- **Default Caching**: Optimized caching settings

## Variables

| Name | Description | Type | Required |
|------|-------------|------|----------|
| `bucket_name` | Name of the S3 bucket for website files | `string` | Yes |
| `domain_name` | Primary domain name for the website | `string` | Yes |
| `alternative_domain_names` | Additional domain names (aliases) | `list(string)` | No |
| `acm_certificate_arn` | ARN of ACM certificate for SSL/TLS | `string` | Yes |
| `index_document` | Default index document | `string` | No |
| `error_document` | Default error document | `string` | No |
| `price_class` | CloudFront price class | `string` | No |
| `default_ttl` | Default TTL for CloudFront cache | `number` | No |
| `max_ttl` | Maximum TTL for CloudFront cache | `number` | No |
| `min_ttl` | Minimum TTL for CloudFront cache | `number` | No |
| `tags` | Resource tags | `map(string)` | No |

## Outputs

| Name | Description |
|------|-------------|
| `website_url` | Public URL of the hosted website |
| `bucket_name` | Name of the S3 bucket created |
| `cloudfront_domain_name` | CloudFront domain name |
| `cloudfront_distribution_id` | ID of the CloudFront distribution |

## Integration with Project

The Static Site module complements the main architecture by providing simpler hosting capabilities:

- **Documentation Hosting**: Can host project documentation or user guides
- **Landing Pages**: Simple landing pages for the project
- **Resource Pages**: Static resources for the main application
- **Marketing Sites**: Non-interactive marketing content

This module is designed to be simpler than the Frontend module and is optimized for traditional static websites rather than dynamic single-page applications.
