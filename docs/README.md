# LTO Demand Planning Documentation

Welcome to the comprehensive documentation for the LTO (Limited Time Offer) Demand Planning application by RedClay.

**Last Updated**: January 6, 2025

## Quick Start

- 🚀 [Local Development Setup](setup/local-development.md) - Get running locally in minutes
- 🔧 [Environment Variables Guide](deployment/vercel/environment-setup.md) - Configure your environment
- 📦 [Deployment Guide](deployment/vercel/strategy.md) - Deploy to production
- 💻 [Common Commands Cheat Sheet](#common-commands)

## Documentation Categories

### 📐 Architecture & Design
- [System Overview](architecture/system-overview.md) - High-level architecture and components
- [Technology Stack](#technology-stack) - Next.js, AWS, Neon PostgreSQL, and more
- [Design Principles](frontend/design-guidelines.md) - UI/UX guidelines and patterns

### ⚙️ Setup & Configuration
- [Local Development](setup/local-development.md) - Prerequisites and setup steps
- [Environment Variables](deployment/vercel/environment-setup.md) - Complete configuration reference
- [Database Setup](database/neon-setup.md) - Neon PostgreSQL configuration

### 🚀 Deployment
- **Vercel Frontend**
  - [Deployment Strategy](deployment/vercel/strategy.md) - Current deployment approach
  - [Dev/Production Strategy](deployment/vercel/dev-production-strategy.md) - Branch-based deployments
  - [Environment Setup](deployment/vercel/environment-setup.md) - Environment variables
  - [Troubleshooting](deployment/vercel/troubleshooting.md) - Common issues and fixes
- **AWS Backend**
  - [Backend Services](deployment/aws/backend-services.md) - Lambda and API Gateway setup
- **GitHub Actions**
  - [Current State](deployment/github-actions/README.md) - One manual workflow exists
  - [Branching Strategy](deployment/github-actions/branching-strategy.md) - Simple 3-tier branch flow
  - [Workflow Order](deployment/github-actions/workflow-order.md) - 5-step execution sequence

### 🗄️ Database
- [Neon PostgreSQL Setup](database/neon-setup.md) - Initial configuration
- [Neon-Vercel Integration](database/neon-vercel-integration.md) - Automatic branch management
- [Branch Management](database/branch-management.md) - PR-based database testing
- [Enable Postgres Forecast](database/enable-postgres-forecast.md) - Forecast data configuration
- **ETL Processes**
  - [Best Practices](database/etl/best-practices.md) - Athena to Neon migration strategies
  - [Manual Process](database/etl/manual-process.md) - Step-by-step ETL guide
- [Legacy Athena System](database/legacy-athena-seeding.md) - Historical reference (LEGACY)

### 🧪 Testing
- [Unit Testing](testing/unit-testing.md) - Jest and React Testing Library
- [Infrastructure Testing](testing/infrastructure-testing.md) - SSM workflow validation
- [Database Testing](testing/database-testing.md) - Neon branch testing strategies
- [Accessibility Testing](testing/accessibility.md) - WCAG compliance verification

### 🎨 Frontend
- [Design Guidelines](frontend/design-guidelines.md) - UI principles and patterns
- [User Experience](frontend/user-experience.md) - Onboarding and user flows
- [Performance Optimization](frontend/performance.md) - Speed and efficiency strategies
- [Legacy Code Inventory](frontend/legacy-code-inventory.md) - Components marked for removal

### 🔧 Operations
- [Deployment Checklist](operations/deployment-checklist.md) - Step-by-step deployment guide
- [SSM Parameter Workflow](operations/ssm-workflow.md) - AWS Systems Manager integration

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: AWS Lambda (Python), API Gateway, Step Functions
- **Database**: Neon PostgreSQL (Serverless), Drizzle ORM
- **Authentication**: AWS Cognito
- **Deployment**: Vercel (Frontend), Terraform (Infrastructure)
- **CI/CD**: GitHub Actions with OIDC authentication

## Common Commands

```bash
# Local Development
cd src/frontend/nextjs-app
npm install
npm run dev

# Database Migrations
npm run db:generate    # Generate migration files
npm run db:push       # Push schema changes
npm run db:migrate    # Run migrations

# Testing
npm test             # Run unit tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# Deployment
git push origin main  # Auto-deploy via Vercel
terraform apply      # Update AWS infrastructure
```

## Documentation Standards

1. **File Naming**: Use kebab-case for all files
2. **Headers**: Start with H1, use proper hierarchy
3. **Metadata**: Include Last Updated, Category, and Status
4. **Code Examples**: Don't use code examples
5. **Links**: Always use relative paths for internal docs
6. **Updates**: Include date for significant changes

## Contributing to Documentation

1. Follow the established folder structure
2. Use the documentation template (see standards above)
3. Update cross-references when moving files
4. Add entries to this README for new documents
5. Mark deprecated content with LEGACY header

### Feature Branch Documentation Workflow

When working on feature branches, temporary documentation is often generated to guide implementation. These documents should follow this workflow:

1. **Store in tmp/ directory**: All feature-specific documentation goes in `docs/tmp/`
2. **Git ignored**: The tmp directory is excluded from version control
3. **Review before merge**: When merging to dev, either:
   - Delete temporary docs if they're no longer needed
   - Update permanent documentation with relevant content
   - Move refined docs to the appropriate category folder

This approach keeps feature documentation organized while preventing clutter in the main documentation structure.

## Known Documentation Gaps

The following documentation is planned for future updates:
- API endpoint reference documentation
- Security best practices guide

## Support

For questions or issues:
- Check the [troubleshooting guides](deployment/vercel/troubleshooting.md)
- Review the [consolidation reports](reports/final-consolidation.md)
- Contact the development team

---

*This documentation is actively maintained. For the latest updates, check the git history or the Last Updated dates on individual documents.*
