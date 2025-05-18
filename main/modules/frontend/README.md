# Frontend Module

## Overview

This module creates and configures the infrastructure for hosting the D3 Visualization Dashboard frontend. It sets up a complete static website hosting solution with S3, CloudFront CDN, ACM certificates, and DNS configuration for an optimal user experience.

## Components

- **S3 Bucket**: Hosts static website assets (HTML, CSS, JS, images)
- **CloudFront Distribution**: CDN for fast, global content delivery
- **ACM Certificate**: SSL/TLS certificate for secure HTTPS access
- **Route 53 Records**: DNS records for custom domain routing
- **Origin Access Identity**: Secures S3 bucket access through CloudFront
- **Cache Policies**: Optimizes caching for different content types

## Variables

| Name | Description | Type | Required |
|------|-------------|------|----------|
| `bucket_name` | Name of the S3 bucket for website assets | `string` | Yes |
| `domain_name` | Primary domain name for the website | `string` | Yes |
| `alternative_domain_names` | Additional domain names (aliases) | `list(string)` | No |
| `acm_certificate_arn` | ARN of ACM certificate for SSL/TLS | `string` | Yes |
| `single_page_application` | Whether the website is a SPA (affects error page handling) | `bool` | No |
| `api_endpoint` | API Gateway endpoint URL for backend integration | `string` | No |
| `cloudfront_price_class` | Price class for CloudFront distribution | `string` | No |
| `default_root_object` | Default root object for CloudFront | `string` | No |
| `error_responses` | Custom error response configurations | `list(map(any))` | No |
| `origin_access_identity_comment` | Comment for CloudFront OAI | `string` | No |
| `tags` | Resource tags | `map(string)` | No |

## Outputs

| Name | Description |
|------|-------------|
| `website_url` | Public URL of the hosted website |
| `bucket_name` | Name of the S3 bucket created |
| `cloudfront_domain_name` | CloudFront domain name |
| `cloudfront_distribution_id` | ID of the CloudFront distribution |
| `cloudfront_origin_access_identity` | OAI details for the CloudFront distribution |

## Integration with Project

The Frontend module is responsible for delivering the user interface of the D3 Dashboard:

- **Single-Page Application Hosting**: Configured for optimal delivery of React-based SPAs
- **API Integration**: Works with the API Gateway module for backend communication
- **Authentication Flow**: Integrates with Cognito for user authentication UI
- **Global Distribution**: Provides low-latency access to the dashboard worldwide
- **Secure Access**: Enforces HTTPS-only access with proper security headers
- **Frontend Deployment**: Provides infrastructure for continuous deployment of frontend code

This module complements the API Gateway and Cognito modules to create a complete, serverless web application infrastructure.
