# Vercel Environment Variables - Remaining Setup

## Status Update
✅ **Successfully Configured (AWS Cognito):**
- NEXT_PUBLIC_AWS_REGION
- NEXT_PUBLIC_USER_POOL_ID
- NEXT_PUBLIC_USER_POOL_CLIENT_ID

❌ **Still Missing (Need to Configure):**

### 1. AWS API Gateway
```
AWS_API_GATEWAY_URL=https://v1zx8vrzzj.execute-api.us-east-2.amazonaws.com
```

### 2. Database Configuration (Critical)
```
DATABASE_URL=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-polished-hill-a5e0j2vc-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-polished-hill-a5e0j2vc.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. External APIs (Need to Obtain)
```
TODOIST_API_KEY=[Get from https://todoist.com/app/settings/integrations/developer]
OPENAI_API_KEY=[Get from https://platform.openai.com/api-keys]
NOTION_API_KEY=[Get from https://www.notion.so/my-integrations]
```

## Next Steps

1. **Add AWS_API_GATEWAY_URL** - This is already documented and ready to add
2. **Add Database URLs** - Use the values above from VERCEL_DEPLOYMENT_FIXES.md
3. **Obtain API Keys** - You'll need accounts with:
   - Todoist (for task integration)
   - OpenAI (for AI features)
   - Notion (for documentation integration)

## Quick Testing

As a temporary workaround to test if database and AWS API Gateway work, you could add dummy values for the external API keys:
```
TODOIST_API_KEY=dummy_key_for_testing
OPENAI_API_KEY=dummy_key_for_testing
NOTION_API_KEY=dummy_key_for_testing
```

This would at least allow the API routes to load and test database/AWS connectivity, though the external integrations won't work until real keys are added.

## Vercel Dashboard Link
[Go to Environment Variables](https://vercel.com/dashboard/project/settings/environment-variables)
