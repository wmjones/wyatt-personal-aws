# Vercel Environment Variables - Minimal Setup for Testing

## Good News!
The external API keys (Todoist, OpenAI, Notion) are **optional in development** and not used by the demand planning dashboard. You can use dummy values to get the application running.

## Required Variables Only

### Copy and paste these exact values:

```
AWS_API_GATEWAY_URL=https://v1zx8vrzzj.execute-api.us-east-2.amazonaws.com
DATABASE_URL=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-polished-hill-a5e0j2vc-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-polished-hill-a5e0j2vc.us-east-2.aws.neon.tech/neondb?sslmode=require
TODOIST_API_KEY=dummy_not_used_in_frontend
OPENAI_API_KEY=dummy_not_used_in_frontend
NOTION_API_KEY=dummy_not_used_in_frontend
```

## Steps
1. Go to [Vercel Dashboard > Environment Variables](https://vercel.com/dashboard/project/settings/environment-variables)
2. Add each variable above
3. Select all environments: ✓ Production, ✓ Preview, ✓ Development
4. Click Save for each
5. Trigger a redeployment

## What Will Work
- ✅ Demand Planning Dashboard
- ✅ Data visualization from Athena
- ✅ User authentication (Cognito)
- ✅ Database operations (Neon)
- ✅ All API routes

## What Won't Work (Until Real Keys Added)
- ❌ Todoist task integration
- ❌ AI-powered features (OpenAI)
- ❌ Notion integration

## Testing After Deployment
Visit these URLs (replace with your Vercel domain):
- `https://your-app.vercel.app/demand-planning` - Main dashboard
- `https://your-app.vercel.app/api/forecast/cache` - Should not return 500 error
- `https://your-app.vercel.app/api/data/athena` - Should not return 500 error
