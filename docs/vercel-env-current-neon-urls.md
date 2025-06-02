# Current Neon Database URLs (Updated from Live Neon Project)

## Current Connection Strings (Production Branch)

### Pooled Connection (DATABASE_URL)
```
DATABASE_URL=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-snowy-dust-a5rl14da-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Direct Connection (DATABASE_URL_UNPOOLED)
```
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-snowy-dust-a5rl14da.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## How URLs Can Change

You're absolutely right that Neon URLs can change when:

1. **New branches are created** - Each branch gets its own compute endpoint
2. **Computes are restarted** - Sometimes endpoint IDs change
3. **Database scaling** - Auto-scaling can affect endpoint names
4. **Manual endpoint changes** - If you modify compute settings

## Best Practices for Managing This

### Option 1: Use Neon's GitHub Integration (Recommended)
Neon provides automatic environment variable management for Vercel:
1. Connect your GitHub repo to your Neon project
2. Enable the Vercel integration in Neon
3. Neon automatically updates Vercel environment variables when URLs change

### Option 2: Use Neon API in CI/CD
You can fetch current URLs programmatically:
```bash
# This would be in a GitHub Action
NEON_API_KEY=your_api_key
DATABASE_URL=$(curl -s "https://console.neon.tech/api/v2/projects/quiet-sea-65967959/connection_uri" \
  -H "Authorization: Bearer $NEON_API_KEY" | jq -r '.uri')
```

### Option 3: Manual Updates (Current Approach)
Check and update URLs when deployment issues occur.

## Quick Check: Are Your URLs Current?

Your documented URLs in VERCEL_DEPLOYMENT_FIXES.md:
```
OLD: ep-polished-hill-a5e0j2vc-pooler.us-east-2.aws.neon.tech
NEW: ep-snowy-dust-a5rl14da-pooler.us-east-2.aws.neon.tech
```

The endpoint changed from `ep-polished-hill-a5e0j2vc` to `ep-snowy-dust-a5rl14da`!

## Immediate Action Required

Use these **current** URLs in Vercel:

```
DATABASE_URL=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-snowy-dust-a5rl14da-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_Inarx4C1bVmv@ep-snowy-dust-a5rl14da.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Future-Proofing

Consider setting up the Neon-Vercel integration to avoid manual URL management:
1. Go to your Neon project settings
2. Look for "Integrations"
3. Enable Vercel integration
4. Connect your Vercel project
5. Neon will automatically manage DATABASE_URL updates
