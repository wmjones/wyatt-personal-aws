# Documentation Inventory

Last updated: 2025-01-06

## Overview
This inventory categorizes all documentation files in the /docs folder as part of the documentation consolidation effort.

Total files: 45 documentation files

## Categories

### 1. Deployment & CI/CD (19 files)
These files cover deployment strategies, GitHub Actions, and CI/CD workflows.

#### Vercel Deployment (13 files)
- `VERCEL_DEPLOYMENT_FIXES.md` - Fixes for Vercel deployment issues
- `vercel-branch-deployment-debug.md` - Debugging branch deployments
- `vercel-deployment-fix-final.md` - Final deployment fixes
- `vercel-deployment-strategy-implemented.md` - Implemented deployment strategy
- `vercel-dev-branch-deployment-setup.md` - Dev branch setup
- `vercel-dev-production-deployment-strategy.md` - Production deployment strategy
- `vercel-env-current-neon-urls.md` - Current Neon database URLs
- `vercel-env-minimal-setup.md` - Minimal environment setup
- `vercel-env-quick-reference.md` - Quick reference for Vercel env vars
- `vercel-env-remaining-setup.md` - Remaining setup tasks
- `vercel-environment-setup.md` - Complete environment setup guide
- `vercel-neon-branch-deployment-guide.md` - Neon branch deployment
- `vercel-org-id-fix.md` - Organization ID fixes

#### GitHub Actions & OIDC (7 files)
- `aws-iam-oidc-setup.md` - AWS IAM OIDC configuration
- `github-actions-aws-oidc-setup.md` - GitHub Actions OIDC setup
- `github-actions-oidc-fix.md` - OIDC fixes
- `github-actions-oidc-setup.md` - Duplicate OIDC setup guide
- `github-actions-workflow-improvements.md` - Workflow improvements
- `fix-oidc-provider-error.md` - OIDC provider error fixes
- `troubleshoot-oidc-role-error.md` - OIDC role troubleshooting

#### General Deployment (3 files)
- `deployment-workflow-checklist.md` - Deployment checklist
- `ssm-deployment-workflow.md` - SSM parameter deployment
- `example-oidc-workflow.yml` - Example workflow file

### 2. Database & Data Management (8 files)
Files related to Neon PostgreSQL, data migration, and database operations.

- `athena-to-neon-etl-best-practices.md` - ETL best practices
- `athena-to-neon-manual-etl.md` - Manual ETL process
- `database-seeding-system.md` - Database seeding
- `enable-postgres-forecast.md` - PostgreSQL forecast enablement
- `neon-branch-management.md` - Neon branch management
- `neon-setup.md` - Neon database setup
- `neon-vercel-integration-quick-start.md` - Quick start integration
- `neon-vercel-integration-setup.md` - Detailed integration setup

### 3. Testing & Quality (4 files)
Testing strategies and guides.

- `automated-ssm-workflow-testing.md` - SSM workflow testing
- `minimal-unit-testing-guide.md` - Unit testing guide
- `testing-neon-branch.md` - Testing with Neon branches
- `accessibility-verification.md` - Accessibility testing

### 4. Frontend & UI (3 files)
UI/UX documentation and analysis.

- `demand-planning-ui-analysis.md` - UI analysis for demand planning
- `ui-experience-flow.md` - User experience flow documentation
- `demand-planning-performance-strategies.md` - Performance optimization

### 5. Infrastructure & AWS (4 files)
AWS infrastructure and Terraform-related documentation.

- `fix-api-gateway-deployment-errors.md` - API Gateway fixes
- `fix-github-actions-drizzle-migrations-aws-auth.md` - Drizzle migration auth
- `lambda-package-drift-prevention.md` - Lambda drift prevention
- `terraform-drift-detection-analysis.md` - Terraform drift detection

### 6. Error Fixes & Troubleshooting (3 files)
Specific error fixes and troubleshooting guides.

- `fix-neon-branch-creation-implementation.md` - Neon branch creation fixes
- `fix-vercel-database-url-error.md` - Database URL error fixes
- `fix-oidc-provider-error.md` - OIDC provider fixes (duplicate in OIDC section)

### 7. Legacy & Historical (1 file)
Historical documentation and legacy code references.

- `legacy_code.md` - Legacy code documentation

## Observations

### Duplication Issues
1. Multiple OIDC setup guides that likely overlap
2. Several Vercel deployment fix documents that may contain redundant information
3. Two Neon-Vercel integration setup guides

### Missing Documentation
1. No comprehensive architecture overview
2. No API documentation
3. No security best practices guide
4. No monitoring and observability guide

### Organization Issues
1. Files are named inconsistently (mix of kebab-case and underscores)
2. No clear versioning or dating system
3. Fix documents mixed with setup guides

## Recommendations for Consolidation

1. **Merge duplicate OIDC documentation** into a single comprehensive guide
2. **Consolidate Vercel deployment docs** into one deployment guide with troubleshooting section
3. **Combine Neon documentation** into a unified database setup and management guide
4. **Create category-based folders** to organize documentation by type
5. **Archive outdated fix documents** once issues are resolved
6. **Standardize naming conventions** across all documentation
