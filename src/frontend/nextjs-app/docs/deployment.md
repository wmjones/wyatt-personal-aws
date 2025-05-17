# Deployment Guide

This guide explains how to deploy the D3 Dashboard to Vercel.

## Prerequisites

1. A GitHub account with the repository
2. A Vercel account (free tier is sufficient)
3. All required environment variables

## Initial Setup

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link Project

From the project directory (`src/frontend/nextjs-app`):

```bash
vercel link
```

Follow the prompts to:
- Choose your Vercel account
- Link to existing project or create new
- Set project name (e.g., `d3-dashboard`)

## Environment Variables

### Required Variables

Set these in the Vercel dashboard (Project Settings > Environment Variables):

```bash
# AWS Cognito
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=your_user_pool_id
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your_client_id

# Database
DATABASE_URL=postgres://...
DATABASE_URL_UNPOOLED=postgres://...

# External APIs
TODOIST_API_KEY=your_key
OPENAI_API_KEY=your_key
NOTION_API_KEY=your_key
```

### Variable Scopes

- **Production**: Variables for the main branch
- **Preview**: Variables for pull request previews
- **Development**: Variables for local development

## Deployment

### Manual Deployment

Deploy to production:
```bash
vercel --prod
```

Deploy preview:
```bash
vercel
```

### Automatic Deployment

Vercel automatically deploys:
- **Production**: When pushing to `main` branch
- **Preview**: When creating pull requests

## Configuration

The `vercel.json` file configures:
- Build settings
- Environment variable mappings
- Function timeouts
- Headers and redirects
- Region selection

## Custom Domain

1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificates are automatic

## Monitoring

### Build Logs
- View in Vercel dashboard
- Check for errors or warnings

### Function Logs
- Access via Vercel dashboard
- Monitor API performance

### Analytics
- Enable Vercel Analytics for performance metrics
- Monitor Core Web Vitals

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs
   - Verify all dependencies are listed in package.json
   - Ensure environment variables are set

2. **Environment Variables Not Loading**
   - Verify variable names match exactly
   - Check variable scopes
   - Restart deployment after changes

3. **Function Timeouts**
   - Adjust timeout in vercel.json
   - Optimize long-running operations
   - Consider using Edge Functions

### Debug Mode

Enable debug logging:
```bash
VERCEL_DEBUG=1 vercel
```

## Best Practices

1. **Security**
   - Never commit sensitive data
   - Use environment variables for secrets
   - Restrict CORS appropriately

2. **Performance**
   - Optimize images and assets
   - Use incremental static regeneration
   - Enable caching headers

3. **Deployment**
   - Test in preview before production
   - Use branch protection rules
   - Monitor deployment status

## Rollback

To rollback to a previous deployment:
1. Go to Vercel dashboard
2. Select the deployment to rollback to
3. Click "Promote to Production"

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables Guide](https://vercel.com/docs/environment-variables)
