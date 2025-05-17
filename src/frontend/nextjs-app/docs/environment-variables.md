# Environment Variables Configuration

This document describes how to configure environment variables for the D3 Dashboard application.

## Overview

The application uses a typed configuration system that validates environment variables at startup and provides type-safe access throughout the application.

## File Structure

```
.env                  # Shared across all environments (DO NOT COMMIT)
.env.local           # Local development overrides (DO NOT COMMIT)
.env.development     # Development defaults (committed)
.env.production      # Production defaults (committed)
.env.example         # Example configuration (committed)
```

## Environment Variables

### Public Variables (Client-side)

These variables are prefixed with `NEXT_PUBLIC_` and are available in the browser:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_AWS_REGION` | AWS region for Cognito | Yes | `us-east-1` |
| `NEXT_PUBLIC_USER_POOL_ID` | Cognito User Pool ID | Yes | `us-east-1_xxxxx` |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | Cognito App Client ID | Yes | `1234567890abcdef` |
| `NEXT_PUBLIC_API_URL` | API base URL | No | `https://api.example.com` |
| `NEXT_PUBLIC_ANALYTICS_ID` | Analytics tracking ID | No | `G-XXXXXXXXXX` |

### Private Variables (Server-side only)

These variables are only available on the server:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes* | `postgres://user:pass@host/db` |
| `DATABASE_URL_UNPOOLED` | Direct connection string | Yes* | `postgres://user:pass@host/db` |
| `TODOIST_API_KEY` | Todoist API key | Yes* | `0123456789abcdef` |
| `OPENAI_API_KEY` | OpenAI API key | Yes* | `sk-...` |
| `NOTION_API_KEY` | Notion API key | Yes* | `secret_...` |

\* Required in production, optional in development

## Configuration System

### 1. Environment Schema

The environment schema is defined in `app/lib/env.ts`:

```typescript
export const envSchema = {
  NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
  NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
  // ... other variables
};
```

### 2. Configuration Service

The configuration service in `app/lib/config.ts` provides structured access:

```typescript
export const config = {
  app: {
    name: 'D3 Dashboard',
    url: getEnvVar('NEXT_PUBLIC_API_URL'),
  },
  auth: {
    aws: {
      region: getEnvVar('NEXT_PUBLIC_AWS_REGION'),
      userPoolId: getEnvVar('NEXT_PUBLIC_USER_POOL_ID'),
    },
  },
  // ... other config sections
};
```

### 3. Client-side Access

Use the `useConfig` hook in React components:

```typescript
import { useConfig } from '@/app/hooks/use-config';

function MyComponent() {
  const config = useConfig();
  const region = config.auth.aws.region;
  // ...
}
```

### 4. Server-side Access

Import the config directly in server components or API routes:

```typescript
import { config } from '@/app/lib/config';

export async function GET() {
  const apiKey = config.external.todoist.apiKey;
  // ...
}
```

## Setup Instructions

### Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values in `.env.local`

3. Start the development server:
   ```bash
   npm run dev
   ```

### Production Deployment

1. Set environment variables in Vercel dashboard
2. Use different values for production vs preview environments
3. Never commit sensitive values to the repository

## Validation

The application validates required environment variables on startup:

- **Development**: Only AWS Cognito variables are required
- **Production**: All variables marked as required must be set

Missing variables will cause the application to fail with a descriptive error.

## Security Best Practices

1. **Never commit** `.env.local` or any file with real credentials
2. **Use different values** for development and production
3. **Rotate secrets** regularly
4. **Limit access** to production environment variables
5. **Use minimal permissions** for API keys

## Troubleshooting

### Variable Not Loading

1. Check variable name matches exactly (case-sensitive)
2. Restart the development server after changes
3. Verify file is named correctly (`.env.local`, not `.env.local.txt`)

### Validation Errors

1. Check which environment you're running (`NODE_ENV`)
2. Verify all required variables for that environment are set
3. Check for typos in variable names

### Client-side Access Issues

1. Ensure variable has `NEXT_PUBLIC_` prefix
2. Rebuild the application after adding new public variables
3. Check browser console for errors
