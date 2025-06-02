/**
 * Debug API Route for Environment Variables
 *
 * This route helps debug environment variable availability in Vercel deployments.
 * Should be removed after debugging is complete.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in non-production or with debug flag
  if (process.env.NODE_ENV === 'production' && !process.env.DEBUG_ENV) {
    return NextResponse.json({ error: 'Debug endpoint disabled in production' }, { status: 403 });
  }

  const envDebug = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,

    // Check which environment variables are set (without revealing values)
    environmentVariables: {
      NEXT_PUBLIC_AWS_REGION: !!process.env.NEXT_PUBLIC_AWS_REGION,
      NEXT_PUBLIC_USER_POOL_ID: !!process.env.NEXT_PUBLIC_USER_POOL_ID,
      NEXT_PUBLIC_USER_POOL_CLIENT_ID: !!process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_UNPOOLED: !!process.env.DATABASE_URL_UNPOOLED,
      AWS_API_GATEWAY_URL: !!process.env.AWS_API_GATEWAY_URL,
      TODOIST_API_KEY: !!process.env.TODOIST_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      NOTION_API_KEY: !!process.env.NOTION_API_KEY,
    },

    // Show partial values for debugging (first 10 chars)
    partialValues: process.env.NODE_ENV !== 'production' ? {
      DATABASE_URL: process.env.DATABASE_URL?.substring(0, 30) + '...',
      DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED?.substring(0, 30) + '...',
      AWS_API_GATEWAY_URL: process.env.AWS_API_GATEWAY_URL?.substring(0, 30) + '...',
    } : undefined,

    // Count total environment variables
    totalEnvVars: Object.keys(process.env).length,

    // List all environment variable names that contain our keywords
    relevantEnvNames: Object.keys(process.env).filter(key =>
      key.includes('DATABASE') ||
      key.includes('AWS') ||
      key.includes('NEXT_PUBLIC') ||
      key.includes('VERCEL') ||
      key.includes('TODOIST') ||
      key.includes('OPENAI') ||
      key.includes('NOTION')
    ).sort(),
  };

  return NextResponse.json(envDebug);
}
