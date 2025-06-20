# Neon-Vercel Integration

**Last Updated**: January 6, 2025
**Status**: GitHub Actions Managed

## How It Works

Database URLs are **dynamically set by GitHub Actions**, not through Vercel's integration marketplace.

### Workflow Process

1. **Push to branch** triggers `nextjs-deploy-with-neon.yml`
2. **Neon branch created** using `neondatabase/create-branch-action@v5`
3. **Environment variables set** in Vercel via CLI:
   - `DATABASE_URL` - Pooled connection
   - `DATABASE_URL_UNPOOLED` - Direct connection
   - `DEPLOYMENT_BRANCH` - Current branch name
4. **Vercel deployment** uses branch-specific database

### Branch Mapping

- `main` → Production deployment (uses main database)
- `dev` → Production deployment (uses dev database)
- `feature/*` → Preview deployment (uses `branch/feature-*` database)

### Environment Variable Resolution

**Next.js uses** `app/db/branch-connection.ts` to resolve database URLs:

1. Checks `DATABASE_URL` environment variable
2. Falls back to `VERCEL_GIT_COMMIT_REF` for branch detection
3. Determines environment type (production/preview/development)
4. Validates connection strings exist

### Required Secrets

**GitHub Repository**:
- `NEON_API_KEY` - Neon API authentication
- `NEON_PROJECT_ID` - Target Neon project
- `VERCEL_TOKEN` - Vercel CLI authentication

**Vercel Dashboard** (for main/dev):
- `DATABASE_URL` - Production pooled connection
- `DATABASE_URL_UNPOOLED` - Production direct connection

### Database Client Configuration

**Pooled** (`DATABASE_URL`):
- Used by default for API routes
- Better for serverless (connection pooling)
- Uses `@neondatabase/serverless`

**Unpooled** (`DATABASE_URL_UNPOOLED`):
- Used for migrations
- Direct connections for transactions
- Single connection pool

### Key Files

- `.github/workflows/nextjs-deploy-with-neon.yml` - Sets up databases
- `app/db/drizzle.ts` - Database client initialization
- `app/db/branch-connection.ts` - URL resolution logic
- `app/lib/env.ts` - Environment validation

### Manual Fallback

If needed, set environment variables directly in Vercel dashboard:
- Production/Preview environments
- Branch-specific variables using Vercel's UI

No marketplace integration required - everything managed through GitHub Actions.
