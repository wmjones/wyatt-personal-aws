import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load environment variables
config({ path: '.env.local' });

export default defineConfig({
  schema: './app/db/schema/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Enable verbose logging in development
  verbose: process.env.NODE_ENV === 'development',
  // Enable strict mode for better type safety
  strict: true,
  // Custom table prefix for better organization
  tablesFilter: ['forecast_*', 'user_*', 'migrations'],
  // Multi-environment support
  migrations: {
    table: 'drizzle_migrations',
    schema: 'public',
  },
});
