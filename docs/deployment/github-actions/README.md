# GitHub Actions Status

**Last Updated**: January 6, 2025
**Status**: Limited Implementation

## Current State

**One manual workflow exists**: `athena-to-neon-manual-etl.yml` for ETL operations. Otherwise, deployments use:
- Shell scripts in `/scripts/` directory
- Terraform Cloud for infrastructure
- Vercel automatic deployments for frontend

## Infrastructure Readiness

OIDC authentication is configured and ready:
- **IAM Role**: `github-actions-role` (dev environment)
- **Permissions**: SSM, S3, Lambda, Athena, Neon API access
- **Authorized branches**: main and dev only

## Planned Architecture

Five workflows will execute in sequence when implemented:
1. **Terraform Plan** - Validate infrastructure changes
2. **Terraform Apply** - Deploy infrastructure
3. **SSM Sync** - Update parameter store
4. **Next.js Deploy** - Frontend with Neon branch
5. **Database Migrations** - Schema updates

Total pipeline duration: ~13 minutes
