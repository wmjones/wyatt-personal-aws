# Vercel Environment Variables - Quick Reference

## Copy-Paste Ready Values

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

### External APIs (Need to obtain)
```
TODOIST_API_KEY=[Get from https://todoist.com/app/settings/integrations/developer]
OPENAI_API_KEY=[Get from https://platform.openai.com/api-keys]
NOTION_API_KEY=[Get from https://www.notion.so/my-integrations]
```

## Vercel Settings
- **Root Directory**: `src/frontend/nextjs-app`
- **Framework Preset**: Next.js
- **Apply to**: ✓ Production, ✓ Preview, ✓ Development

## Quick Links
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Todoist Developer](https://todoist.com/app/settings/integrations/developer)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Notion Integrations](https://www.notion.so/my-integrations)


DATABASE_URL	postgresql://neondb_owner:******@ep-snowy-dust-a5rl14da-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED	postgresql://neondb_owner:******@ep-snowy-dust-a5rl14da.us-east-2.aws.neon.tech/neondb?sslmode=require
