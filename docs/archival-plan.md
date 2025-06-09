# Documentation Archival Plan

Based on the comprehensive review of all documentation categories, this plan outlines which files to archive, keep, or consolidate.

## Files to Archive

### Deployment Documentation (13 files to archive)
These files contain historical fixes or have been superseded by current documentation:

1. `vercel-branch-deployment-debug.md` - Superseded by implemented strategy
2. `vercel-deployment-fix-final.md` - Historical fix, now resolved
3. `vercel-dev-branch-deployment-setup.md` - Superseded by strategy docs
4. `vercel-env-current-neon-urls.md` - Should be part of environment setup
5. `vercel-env-minimal-setup.md` - Merge into main environment setup
6. `vercel-env-quick-reference.md` - Merge into main environment setup
7. `vercel-env-remaining-setup.md` - Historical task list
8. `vercel-neon-branch-deployment-guide.md` - Merge relevant parts into database docs
9. `vercel-org-id-fix.md` - Historical fix
10. `aws-iam-oidc-setup.md` - Manual approach not used in this project
11. `github-actions-aws-oidc-setup.md` - CLI approach not used
12. `github-actions-oidc-fix.md` - Content merged into main guide
13. `github-actions-workflow-improvements.md` - Historical improvements doc

### Database Documentation (1 file to mark as legacy)
1. `database-seeding-system.md` - Legacy Athena-based system (mark with LEGACY header)

### Other Documentation (5 files to review)
1. `fix-api-gateway-deployment-errors.md` - Likely historical fix
2. `fix-github-actions-drizzle-migrations-aws-auth.md` - Likely historical fix
3. `fix-neon-branch-creation-implementation.md` - Likely historical fix
4. `fix-vercel-database-url-error.md` - Likely historical fix
5. `lambda-package-drift-prevention.md` - Review if still relevant
6. `terraform-drift-detection-analysis.md` - Review if still relevant
7. `legacy_code.md` - Already marked as legacy

## Files to Keep (Active Documentation)

### Deployment (6 files)
- `VERCEL_DEPLOYMENT_FIXES.md` - Essential troubleshooting
- `vercel-deployment-strategy-implemented.md` - Current architecture
- `vercel-dev-production-deployment-strategy.md` - Core strategy
- `vercel-environment-setup.md` - Needs update with current URLs
- `deployment-workflow-checklist.md` - Operational reference
- `ssm-deployment-workflow.md` - SSM parameter management

### GitHub Actions & OIDC (3 files)
- `github-actions-oidc-setup.md` - Terraform-based setup
- `troubleshoot-oidc-role-error.md` - Comprehensive troubleshooting
- `fix-oidc-provider-error.md` - Specific Terraform fix
- `example-oidc-workflow.yml` - Reference workflow

### Database (7 files)
- `athena-to-neon-etl-best-practices.md` - ETL strategies
- `athena-to-neon-manual-etl.md` - Implementation guide
- `enable-postgres-forecast.md` - Current architecture
- `neon-setup.md` - Core configuration
- `neon-branch-management.md` - Lifecycle management
- `neon-vercel-integration-quick-start.md` - To be merged
- `neon-vercel-integration-setup.md` - To be merged

### Testing (4 files)
- `automated-ssm-workflow-testing.md` - Infrastructure testing
- `minimal-unit-testing-guide.md` - Application testing
- `testing-neon-branch.md` - Database testing
- `accessibility-verification.md` - WCAG compliance

### UI/Frontend (3 files)
- `demand-planning-ui-analysis.md` - Design principles
- `ui-experience-flow.md` - User onboarding
- `demand-planning-performance-strategies.md` - Performance optimization

## Consolidation Actions

### Merge Operations
1. Combine `neon-vercel-integration-quick-start.md` and `neon-vercel-integration-setup.md` into single guide
2. Extract relevant content from files marked for archival before moving them

### Update Operations
1. Add LEGACY header to `database-seeding-system.md`
2. Update `vercel-environment-setup.md` with current database URLs
3. Add "Last Updated" dates to all active documentation

## Archive Structure

```
docs/
├── archive/
│   ├── README.md (explains archival decisions)
│   ├── deployment-legacy/
│   │   ├── vercel-branch-deployment-debug.md
│   │   ├── vercel-deployment-fix-final.md
│   │   ├── [other archived Vercel docs]
│   │   ├── aws-iam-oidc-setup.md
│   │   └── github-actions-aws-oidc-setup.md
│   └── fixes-historical/
│       ├── fix-api-gateway-deployment-errors.md
│       ├── fix-github-actions-drizzle-migrations-aws-auth.md
│       ├── fix-neon-branch-creation-implementation.md
│       └── fix-vercel-database-url-error.md
```

## Summary Statistics

- **Total files reviewed**: 45
- **Files to keep active**: 24 (53%)
- **Files to archive**: 20 (44%)
- **Files to mark legacy**: 1 (2%)
- **Expected reduction**: 44% fewer files in main docs folder

## Implementation Priority

1. **High Priority**: Archive historical fixes and superseded documentation
2. **Medium Priority**: Merge overlapping integration guides
3. **Low Priority**: Update cross-references and add dates

This archival plan maintains all valuable information while significantly improving documentation organization and reducing clutter.
