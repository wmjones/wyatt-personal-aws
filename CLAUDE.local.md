# CLAUDE.local.md

## Project Directory Structure

```
/workspaces/wyatt-personal-aws/
   .devcontainer/          # Development container configuration
   ai_docs/                # Documentation and specifications
   main/                   # Terraform infrastructure code
      modules/            # Reusable Terraform modules
      environments/       # Environment-specific configs
   scripts/                # Build and deployment scripts
   src/                    # Application source code
      frontend/
         nextjs-app/    # Next.js application
         react-app/     # Legacy React application
      lambda/            # AWS Lambda functions
   tasks/                  # Task Master project management
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
