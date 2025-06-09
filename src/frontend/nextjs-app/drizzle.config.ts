import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load environment variables
config({ path: '.env.local' });

// Validate DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}
if (databaseUrl && !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error('DATABASE_URL must start with postgresql:// or postgres://');
}


export default defineConfig({
  schema: './app/db/schema/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
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
