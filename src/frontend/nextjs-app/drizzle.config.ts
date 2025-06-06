import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load environment variables
config({ path: '.env.local' });

// Check if running generate command (which doesn't need a database connection)
const isGenerateCommand = process.argv.includes('generate');

// Validate DATABASE_URL - only required for commands that connect to the database
const databaseUrl = process.env.DATABASE_URL;
if (!isGenerateCommand && !databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}
if (databaseUrl && !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error('DATABASE_URL must start with postgresql:// or postgres://');
}

// Use a dummy URL for generate command if DATABASE_URL is not set
const connectionUrl = databaseUrl || 'postgresql://dummy:dummy@localhost:5432/dummy';

export default defineConfig({
  schema: './app/db/schema/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionUrl,
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
