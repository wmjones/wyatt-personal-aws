# CLAUDE.local.md

## Project Directory Structure

```
/workspaces/wyatt-personal-aws-2/
   .devcontainer/          # Development container configuration
   ai_docs/                # Documentation and specifications
   main/                   # Terraform infrastructure code
      modules/            # Reusable Terraform modules
      environments/       # Environment-specific configs
   scripts/                # Build and deployment scripts
   src/                    # Application source code
      frontend/
         nextjs-app/    # Next.js application
      lambda/            # AWS Lambda functions
   .taskmaster/            # Task Master data and configuration
```

## User Preferences

- **IMPORTANT**: Always search the web for simple solutions or available packages before implementing custom code
- prefer to first use context7 to get documentation and use the web as a fallback
- use Task Master to manage tasks and assume the Task Master project has been initalized
- Prefer importing and using existing functionality over creating custom implementations
- Look for established npm packages, React hooks, Next.js utilities, and AWS SDK methods
- Only create custom code when necessary or when existing solutions don't meet requirements
- Prioritize well-maintained, popular packages with good documentation
- Keep solutions simple and maintainable by leveraging community packages
- dont create backup of files when refactoring or cleaning up the codebase. rely on git for versioning.

## Project Context

- Using Next.js 14 with App Router for frontend
- Tailwind CSS v4 for styling
- AWS backend services (Lambda, DynamoDB, Cognito)
- Hybrid architecture: Vercel frontend + AWS backend
- Task Master for project management

## Shell Aliases

- **Claude/Task**: `cc` (claude-code), `tm` (taskmaster), `tms` (status), `tmn` (next)
- **Navigation**: `cdfr` (frontend), `cdtf` (terraform), `cdroot` (project root)
- **Git**: `gs` (status), `gp` (pull), `gpu` (push), `gco` (checkout), `gcm` (commit -m)
- **Dev**: `tf` (terraform), `tfa` (apply), `tfp` (plan), `dc` (docker compose), `nrd` (npm run dev)
- **Features**: Auto-CD, command correction, case-insensitive completion, shared history

## Feature Branch Documentation Workflow

When working on feature branches, AI-generated documentation (architecture decisions, implementation guides, etc.) should be managed as follows:

1. **Store temporarily in docs/tmp/**: All feature-specific documentation generated during development goes in the `docs/tmp/` directory
2. **Excluded from git**: The tmp directory is gitignored to prevent cluttering the repository
3. **Review on merge**: Before merging to dev, review all tmp docs and either:
   - Delete if no longer relevant
   - Integrate valuable content into permanent docs
   - Move polished docs to appropriate category folders

This keeps feature work organized while maintaining clean documentation.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
