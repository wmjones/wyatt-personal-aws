import json
import re
import os


def lambda_handler(event, context):
    """
    Handles CORS preflight requests for dynamic origins including Vercel preview deployments
    """
    # Get the origin from the request headers
    headers = event.get("headers", {})
    origin = headers.get("origin") or headers.get("Origin", "")

    # Allowed static origins
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    # Add production domain if configured
    prod_domain = os.environ.get("PRODUCTION_DOMAIN")
    if prod_domain:
        allowed_origins.append(f"https://{prod_domain}")

    # Pattern for Vercel preview URLs
    # Format: <project-name>-<unique-hash>-<scope-slug>.vercel.app
    # Updated to match your Vercel project name: wyatt-personal-aws
    vercel_pattern = r"^https://wyatt-personal-aws-[a-z0-9]+-[a-z0-9-]+\.vercel\.app$"

    # Check if origin is allowed
    is_allowed = False
    if origin in allowed_origins:
        is_allowed = True
    elif re.match(vercel_pattern, origin):
        is_allowed = True

    # Build response
    response_headers = {"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH", "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token", "Access-Control-Max-Age": "3600"}

    # Only add the origin header if it's allowed
    if is_allowed and origin:
        response_headers["Access-Control-Allow-Origin"] = origin

    return {"statusCode": 200, "headers": response_headers, "body": json.dumps({"message": "CORS preflight response"})}
