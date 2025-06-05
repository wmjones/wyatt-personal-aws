# Lambda Package Drift Prevention

## Overview

This document explains how we prevent false positive drift detection for Lambda functions when deployment packages are rebuilt without actual code changes.

## The Problem

Lambda functions in AWS track the source code hash of their deployment package. When the deployment package is rebuilt:
- File timestamps change
- Zip compression may vary slightly
- The resulting hash is different even if no code changed
- Terraform detects this as "drift" requiring an update

This creates noise in drift detection reports and can mask real infrastructure changes.

## The Solution

We implement a multi-layered approach to prevent false positives:

### 1. Normalized Lambda Packages

In `.github/workflows/deployment_package_zip.yml`, we normalize all Lambda deployment packages by:

- Setting consistent timestamps (2000-01-01 00:00:00) for all files
- Removing compiled Python files (`*.pyc`, `__pycache__`)
- Using consistent zip compression settings (`-Xr9D` flags)
- Excluding unnecessary files

Example:
```bash
# Set consistent timestamps
find . -type f -exec touch -t 200001010000.00 {} \;

# Create zip with consistent settings
zip -Xr9D deployment_package.zip . -x "*.git*" -x "*.pyc" -x "__pycache__/*"
```

### 2. Enhanced Drift Detection Workflow

The drift detection workflow now:
- Downloads the same normalized packages used for deployment
- Includes a note in drift reports about Lambda package normalization
- Advises checking if changes are only to `source_code_hash`

### 3. Helper Scripts

**`scripts/normalize-lambda-packages.sh`**
- Normalizes existing Lambda packages
- Can be run locally to ensure consistency

**`scripts/filter-lambda-drift.sh`**
- Analyzes Terraform plan JSON output
- Filters out changes that are only to `source_code_hash`
- Reports only "real" drift

## Usage

### During CI/CD

The deployment package workflow automatically creates normalized packages:
```yaml
- name: Build Node.js Athena Lambda package
  run: |
    cd src/lambda/athena
    npm ci --only=production
    # Use consistent timestamps for reproducible builds
    find . -type f -exec touch -t 200001010000.00 {} \;
    zip -Xr9D athena-lambda.zip . -x "*.git*" -x "*.zip" -x "node_modules/.cache/*"
```

### Local Development

To normalize packages locally:
```bash
cd main/
../scripts/normalize-lambda-packages.sh
```

### Analyzing Drift

To check if drift is real or just package hashes:
```bash
# Generate plan
terraform plan -out=tfplan

# Export to JSON
terraform show -json tfplan > plan.json

# Analyze for real drift
./scripts/filter-lambda-drift.sh plan.json
```

## Best Practices

1. **Always use normalized packages** - Both in CI/CD and local development
2. **Check plan details** - When drift is detected, verify if it's only `source_code_hash`
3. **Update packages intentionally** - Only update Lambda functions when code actually changes
4. **Monitor real drift** - Focus on non-Lambda drift or Lambda changes beyond hash

## Limitations

- Terraform Cloud's remote execution makes it harder to filter drift automatically
- Manual review of plans may still be needed to distinguish real changes
- Package normalization must be consistently applied across all workflows

## Future Improvements

1. Integrate drift filtering directly into Terraform Cloud workflows
2. Create custom Terraform provider that ignores source_code_hash drift
3. Implement content-based hashing that ignores timestamps
