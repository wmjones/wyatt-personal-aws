# Terraform Drift Detection Workflow Analysis

## Executive Summary

This document analyzes the current Terraform drift detection GitHub Action workflow and compares it with the terraform_apply.yml workflow to identify improvements and inconsistencies.

## Key Findings

### 1. Authentication Method Inconsistency

**Issue**: The drift detection workflow uses traditional AWS access keys while terraform_apply.yml uses Terraform Cloud's native integration.

- **Drift Detection**: Uses `aws-actions/configure-aws-credentials` with long-lived AWS credentials
- **Apply/Plan Workflows**: Use Terraform Cloud's native authentication via API token only

**Recommendation**: Remove AWS credentials from drift detection and rely on Terraform Cloud's remote execution.

### 2. Different Terraform Execution Approaches

**Issue**: Inconsistent execution methods between workflows.

- **Drift Detection**: Runs terraform commands locally in GitHub Actions
- **Apply/Plan Workflows**: Use Terraform Cloud's remote execution via API

**Impact**: This creates potential for configuration drift between local and remote execution environments.

### 3. Missing Dependencies and Caching

**Improvements Needed**:
- No caching of Terraform providers/modules (increases execution time)
- No dependency on deployment packages (athena, forecast-sync lambdas)
- No parallelization of environment checks

### 4. Limited Error Handling and Reporting

**Current State**:
- Basic exit code checking
- Simple stdout/stderr capture
- No structured drift reporting

**Missing Features**:
- Retry logic for transient failures
- Structured JSON output for drift details
- Metrics collection for drift frequency

### 5. Security Concerns

**Issues**:
- Long-lived AWS credentials in secrets
- No OIDC authentication
- Missing permissions boundaries
- No workflow approval for production fixes

## Recommended Improvements

### 1. Align with Terraform Cloud Native Approach

```yaml
- name: Create Drift Detection Run
  uses: hashicorp/tfc-workflows-github/actions/create-run@v1.0.0
  with:
    workspace: ${{ env.TF_WORKSPACE }}
    plan_only: true

- name: Get Plan Output
  uses: hashicorp/tfc-workflows-github/actions/plan-output@v1.0.0
  with:
    plan: ${{ fromJSON(steps.plan-run.outputs.payload).data.relationships.plan.data.id }}
```

### 2. Implement OIDC Authentication

```yaml
permissions:
  id-token: write
  contents: read
  issues: write

- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-role
    aws-region: us-east-2
```

### 3. Add Caching and Optimization

```yaml
- name: Cache Terraform Modules
  uses: actions/cache@v4
  with:
    path: |
      ~/.terraform.d/plugin-cache
      ./main/.terraform
    key: ${{ runner.os }}-terraform-${{ hashFiles('**/.terraform.lock.hcl') }}
```

### 4. Implement Matrix Strategy for Parallel Execution

```yaml
strategy:
  matrix:
    environment: [dev, prod]

env:
  TF_WORKSPACE: wyatt-personal-aws-${{ matrix.environment }}
```

### 5. Enhanced Drift Reporting

```yaml
- name: Generate Drift Report
  if: steps.plan.outputs.changes == 'true'
  run: |
    terraform show -json tfplan > drift-${{ matrix.environment }}.json
    # Parse and create structured report

- name: Upload Drift Report
  uses: actions/upload-artifact@v4
  with:
    name: drift-reports
    path: drift-*.json
```

### 6. Implement Automated Fix Capability

```yaml
- name: Auto-Fix Drift (if enabled)
  if: inputs.fix_drift && steps.plan.outputs.changes == 'true'
  uses: hashicorp/tfc-workflows-github/actions/apply-run@v1.0.0
  with:
    run: ${{ steps.drift-run.outputs.run_id }}
    comment: "Auto-fixing drift detected in ${{ matrix.environment }}"
```

## Implementation Priority

1. **High Priority**:
   - Switch to Terraform Cloud native execution
   - Remove AWS credentials and implement OIDC
   - Add deployment package dependencies

2. **Medium Priority**:
   - Implement caching strategies
   - Add parallel execution with matrix
   - Enhance error handling and retry logic

3. **Low Priority**:
   - Add metrics collection
   - Implement auto-fix capability
   - Create drift visualization dashboard

## Conclusion

The current drift detection workflow is functional but uses outdated patterns compared to the modern terraform_apply.yml workflow. Aligning these workflows will improve security, performance, and maintainability while reducing the potential for configuration drift between different execution environments.
