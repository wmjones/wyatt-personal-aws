# Load Project Context

This command loads comprehensive project documentation into Claude's context.

## Files to Load

Load the following files in order:

1. **Main Project Instructions**
   - `/workspaces/wyatt-personal-aws/CLAUDE.md`

2. **AI Documentation Suite**
   - `/workspaces/wyatt-personal-aws/ai_docs/1_project_overview.md`
   - `/workspaces/wyatt-personal-aws/ai_docs/2_d3_dashboard.md`
   - `/workspaces/wyatt-personal-aws/ai_docs/3_productivity_system.md`
   - `/workspaces/wyatt-personal-aws/ai_docs/4_terraform_modules.md`
   - `/workspaces/wyatt-personal-aws/ai_docs/5_environment_configuration.md`
   - `/workspaces/wyatt-personal-aws/ai_docs/6_implementation_roadmap.md`
   - `/workspaces/wyatt-personal-aws/ai_docs/7_technical_specifications.md`

3. **Additional Documentation**
   - `/workspaces/wyatt-personal-aws/ai_docs/consolidated_prd.md`
   - `/workspaces/wyatt-personal-aws/ai_docs/consolidated_migration_guide.md`
   - `/workspaces/wyatt-personal-aws/ai_docs/design_requirements.md`
   - `/workspaces/wyatt-personal-aws/ai_docs/color_palette.md`

## Usage

To use this command, simply reference it in your Claude conversation:

```
/load-project-context
```

This will ensure Claude has full understanding of:
- Project architecture (Next.js on Vercel + AWS backend)
- D3 Dashboard implementation details
- Productivity system workflow
- Terraform infrastructure modules
- Environment configurations
- Technical specifications
- Design system and requirements

## Notes

- The project uses a hybrid architecture with Next.js frontend on Vercel and AWS backend services
- The React app has been deprecated in favor of Next.js
- All infrastructure is managed via Terraform modules
- Task management is handled by Task Master AI
