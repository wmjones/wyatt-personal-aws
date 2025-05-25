# Vercel Environment Variables - Quick Reference

## Required Variables for Vercel

### AWS Configuration
```
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_USER_POOL_ID=us-east-2_FebjdKLG3
NEXT_PUBLIC_USER_POOL_CLIENT_ID=3i464fgdtarund735fjc0b5b6c
AWS_API_GATEWAY_URL=https://v1zx8vrzzj.execute-api.us-east-2.amazonaws.com
```

### Database Configuration (UPDATED - Current URLs)
```
DATABASE_URL=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-snowy-dust-a5rl14da-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-snowy-dust-a5rl14da.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Performance Optimization (RECOMMENDED)
```
NEXT_PUBLIC_USE_POSTGRES_FORECAST=true
```
*This enables the optimized Postgres forecast service instead of direct Athena queries, reducing load times from 30+ seconds to 2-3 seconds.*

## Optional Variables (Not Required for Vercel)

**These are NOT needed for Vercel deployment** - they are used by AWS Lambda functions, not the Next.js frontend.

❌ **Do NOT add these to Vercel:**
- TODOIST_API_KEY
- OPENAI_API_KEY
- NOTION_API_KEY

*If you previously added these with placeholder values like `[Optional - handled by AWS backend]`, please remove them from your Vercel environment variables.*

## Vercel Settings
- **Root Directory**: `src/frontend/nextjs-app`
- **Framework Preset**: Next.js
- **Apply to**: ✓ Production, ✓ Preview, ✓ Development

## Troubleshooting

### If you previously set placeholder values:

If you accidentally set environment variables to placeholder text like:
- `TODOIST_API_KEY=[Optional - handled by AWS backend]`
- `OPENAI_API_KEY=[Optional - handled by AWS backend]`
- `NOTION_API_KEY=[Optional - handled by AWS backend]`

**Please remove these variables entirely from Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Delete any variables with placeholder/comment values
3. Only keep the 6 required variables listed above

### Environment Variable Scope
Make sure each required variable is enabled for:
- ✅ Production
- ✅ **Preview** (this is crucial for branch deployments)
- ✅ Development

## Quick Links
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Neon Console](https://console.neon.tech) - For database URL updates
