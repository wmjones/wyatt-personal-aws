# /context - Load Project Documentation

This command loads all project documentation into Claude's context for comprehensive understanding.

## Command Implementation

When this command is invoked, Claude should read the following files:

1. `CLAUDE.md` - Main project instructions and guidance
2. `ai_docs/1_project_overview.md` - Architecture overview
3. `ai_docs/2_d3_dashboard.md` - D3 Dashboard details
4. `ai_docs/3_productivity_system.md` - Productivity workflow
5. `ai_docs/4_terraform_modules.md` - Infrastructure modules
6. `ai_docs/5_environment_configuration.md` - Environment setup
7. `ai_docs/6_implementation_roadmap.md` - Implementation plan
8. `ai_docs/7_technical_specifications.md` - Technical specs
9. `ai_docs/consolidated_prd.md` - Product requirements
10. `ai_docs/consolidated_migration_guide.md` - Migration guide
11. `ai_docs/design_requirements.md` - Design system
12. `ai_docs/color_palette.md` - Color specifications

## Usage Example

```
User: /context
Claude: [Reads all documentation files and responds with confirmation]
```

## Key Information Summary

After loading, Claude will have knowledge of:
- **Architecture**: Hybrid approach with Next.js on Vercel + AWS backend
- **Frontend**: Next.js 14 with App Router, React Server Components, Tailwind CSS v4
- **Backend**: AWS Lambda, DynamoDB, API Gateway, Cognito, Step Functions
- **Infrastructure**: Terraform modules-based IaC
- **Development**: Task Master AI for project management
- **Deprecated**: React app removed in favor of Next.js
