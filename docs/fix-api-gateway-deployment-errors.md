# Fix Guide: API Gateway v2 Deployment Errors

This guide addresses two common API Gateway v2 deployment errors encountered in the project.

## Error 1: AuthorizerPayloadFormatVersion Error

### Error Message
```
Error: creating API Gateway v2 Authorizer (cognito-jwt-authorizer): operation error ApiGatewayV2: CreateAuthorizer,
BadRequestException: AuthorizerPayloadFormatVersion can only be set for REQUEST authorizer.
```

### Root Cause
The `authorizer_payload_format_version` parameter is only applicable to Lambda (REQUEST) authorizers, not JWT authorizers. JWT authorizers work through direct token validation by API Gateway and don't use this parameter.

### Solution
Remove the `authorizer_payload_format_version` from JWT authorizer configurations.

**File to modify**: `/main/modules/api_gateway/main.tf`

**Current code** (around line 115):
```hcl
resource "aws_apigatewayv2_authorizer" "this" {
  for_each = var.authorizers

  api_id                            = aws_apigatewayv2_api.this.id
  authorizer_type                   = try(each.value.authorizer_type, "JWT")
  identity_sources                  = try(each.value.identity_sources, ["$request.header.Authorization"])
  name                              = try(each.value.name, each.key)
  authorizer_payload_format_version = try(each.value.payload_format_version, "2.0")

  dynamic "jwt_configuration" {
    for_each = each.value.authorizer_type == "JWT" ? [1] : []

    content {
      audience = try(each.value.audience, null)
      issuer   = try(each.value.issuer, null)
    }
  }
}
```

**Fixed code**:
```hcl
resource "aws_apigatewayv2_authorizer" "this" {
  for_each = var.authorizers

  api_id                            = aws_apigatewayv2_api.this.id
  authorizer_type                   = try(each.value.authorizer_type, "JWT")
  identity_sources                  = try(each.value.identity_sources, ["$request.header.Authorization"])
  name                              = try(each.value.name, each.key)
  # Only set payload format version for REQUEST (Lambda) authorizers
  authorizer_payload_format_version = each.value.authorizer_type == "REQUEST" ? try(each.value.payload_format_version, "2.0") : null

  dynamic "jwt_configuration" {
    for_each = each.value.authorizer_type == "JWT" ? [1] : []

    content {
      audience = try(each.value.audience, null)
      issuer   = try(each.value.issuer, null)
    }
  }
}
```

## Error 2: Route Conflict Errors

### Error Messages
```
Error: creating API Gateway v2 Route: ConflictException: Route with key POST /api/visualizations already exists
Error: creating API Gateway v2 Route: ConflictException: Route with key PUT /api/visualizations/{id} already exists
Error: creating API Gateway v2 Route: ConflictException: Route with key DELETE /api/visualizations/{id} already exists
[etc...]
```

### Root Cause
This is a known issue with API Gateway v2 and Terraform's concurrent resource creation. The CORS OPTIONS routes are trying to be created with the same keys as the actual HTTP method routes.

### Solution 1: Fix CORS Route Key Generation
The issue is in the CORS OPTIONS route creation logic. The replace function isn't working correctly.

**File to modify**: `/main/modules/api_gateway/main.tf`

**Current code** (around line 100):
```hcl
resource "aws_apigatewayv2_route" "cors_options" {
  for_each = var.enable_dynamic_cors ? toset([for key in keys(var.integrations) : replace(key, "GET|POST|PUT|DELETE|PATCH", "OPTIONS") if can(regex("^(GET|POST|PUT|DELETE|PATCH) ", key))]) : []

  api_id             = aws_apigatewayv2_api.this.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.cors_options[0].id}"
  authorization_type = "NONE"
}
```

**Fixed code**:
```hcl
resource "aws_apigatewayv2_route" "cors_options" {
  for_each = var.enable_dynamic_cors ? toset([
    for key in keys(var.integrations) :
    replace(key, "/^(GET|POST|PUT|DELETE|PATCH) /", "OPTIONS ")
    if can(regex("^(GET|POST|PUT|DELETE|PATCH) ", key))
  ]) : []

  api_id             = aws_apigatewayv2_api.this.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.cors_options[0].id}"
  authorization_type = "NONE"
}
```

### Solution 2: Reduce Terraform Parallelism (Alternative)
If the above fix doesn't work due to concurrent modification issues, reduce parallelism:

```bash
terraform apply -parallelism=1 -var-file=environments/dev.tfvars
```

### Solution 3: Add Explicit Dependencies (If needed)
Add dependencies to ensure routes are created sequentially:

```hcl
resource "aws_apigatewayv2_route" "cors_options" {
  # ... existing configuration ...

  depends_on = [
    aws_apigatewayv2_route.this
  ]
}
```

## Testing the Fixes

1. Apply the code changes to the module files
2. Run `terraform plan -var-file=environments/dev.tfvars` to verify the changes
3. Run `terraform apply -var-file=environments/dev.tfvars`
4. If concurrent modification errors persist, use `-parallelism=1`

## Prevention Tips

1. Always specify authorizer types explicitly
2. Be careful with regex replacements in Terraform
3. Consider using explicit route definitions for CORS instead of dynamic generation
4. Test infrastructure changes in dev environment first

## Reference Links
- [AWS API Gateway v2 JWT Authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
- [Terraform API Gateway v2 Authorizer](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/apigatewayv2_authorizer)
- [API Gateway v2 Concurrent Modification Issues](https://github.com/hashicorp/terraform-provider-aws/issues/18018)
