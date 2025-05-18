# Testing Your Branch with Neon Database

This guide explains how to test your current branch state with a Neon database branch.

## Quick Start

1. **Create a Pull Request**
   - Push your branch to GitHub
   - Create a PR against your target branch (usually `main` or `dev`)

2. **Wait for Database Creation**
   - GitHub Actions will automatically create a Neon branch
   - Look for a comment on your PR with database connection details

3. **Local Testing**
   ```bash
   # Copy the DATABASE_URL from the PR comment
   # Create .env.local in your Next.js app
   echo "DATABASE_URL=<paste-url-here>" > .env.local
   echo "DATABASE_URL_UNPOOLED=<paste-unpooled-url-here>" >> .env.local

   # Run your application
   npm run dev
   ```

## Workflow Details

### Automatic Branch Creation
When you create or update a PR, the workflow:
- Creates a Neon branch named `preview/pr-{number}-{branch-name}`
- Copies all data from the parent database
- Posts connection strings as a PR comment

### Using the Preview Database
The preview database is a complete copy of your parent branch data, allowing you to:
- Test schema migrations safely
- Verify data transformations
- Test new features with production-like data
- Run integration tests

### Database URLs
You'll receive two URLs:
- **DATABASE_URL**: Pooled connection (use for serverless/edge)
- **DATABASE_URL_UNPOOLED**: Direct connection (use for migrations)

## Testing Workflow

1. **Schema Changes**
   ```bash
   # Apply migrations to your PR database
   DATABASE_URL=<pr-database-url> npm run db:migrate
   ```

2. **Data Testing**
   ```bash
   # Connect to the PR database
   psql <pr-database-url>

   # Run queries, test data
   SELECT * FROM users LIMIT 10;
   ```

3. **Application Testing**
   ```bash
   # Start your app with PR database
   DATABASE_URL=<pr-database-url> npm run dev

   # Test features that interact with the database
   ```

## Vercel Preview Integration

If configured, the workflow also:
- Updates Vercel preview deployments with PR database URLs
- Allows testing the full stack in preview environments
- Automatically switches back when PR is merged/closed

## Best Practices

1. **Don't Share URLs**: Database URLs contain credentials
2. **Test Migrations**: Always test schema changes on PR branches
3. **Verify Data**: Check that test data looks correct
4. **Clean Up**: Branches are auto-deleted when PRs close

## Troubleshooting

### Can't connect to database
- Check if the URL was correctly copied
- Verify your IP is allowed (Neon security settings)
- Try the unpooled URL for testing

### Migrations fail
- Use the unpooled URL for migrations
- Check for connection timeout issues
- Verify migration scripts are correct

### No PR comment appears
- Check GitHub Actions for errors
- Verify secrets/variables are configured
- Ensure workflow has PR write permissions

## Manual Branch Management

If needed, you can manage branches manually:

```bash
# Using Neon CLI
neon branch create --name preview/manual-test
neon branch list
neon branch delete preview/manual-test
```

## Summary

1. Create/update a PR
2. Wait for the database branch comment
3. Copy connection strings to `.env.local`
4. Test your application with the PR database
5. Merge PR when ready (branch auto-deletes)
