import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzleServerless } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { resolveDatabaseConfig, getDatabaseDescription } from './branch-connection';

// Get database configuration based on deployment environment
const dbConfig = resolveDatabaseConfig();
const DATABASE_URL = dbConfig.databaseUrl;
const DATABASE_URL_UNPOOLED = dbConfig.databaseUrlUnpooled || dbConfig.databaseUrl;

// Log database connection info (only in development or with debug flag)
if (process.env.NODE_ENV === 'development' || process.env.DEBUG_DB) {
  console.log(`[Drizzle] Connecting to ${getDatabaseDescription()}`);
}

// HTTP client for one-off queries (good for serverless)
const sql = neon(DATABASE_URL);
export const db = drizzle({
  client: sql,
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Pooled connection for transaction support and better performance
let pool: Pool | null = null;
let dbPooled: ReturnType<typeof drizzleServerless> | null = null;

export function getPooledDb() {
  if (!pool) {
    // Use unpooled connection if available for transactions
    const connectionString = DATABASE_URL_UNPOOLED || DATABASE_URL;
    pool = new Pool({ connectionString });
    dbPooled = drizzleServerless({
      client: pool,
      schema,
      logger: process.env.NODE_ENV === 'development',
    });
  }
  return dbPooled!;
}

// Migration-specific connection (uses unpooled connection)
export function getMigrationDb() {
  const connectionString = DATABASE_URL_UNPOOLED || DATABASE_URL;
  const migrationPool = new Pool({
    connectionString,
    max: 1, // Single connection for migrations
  });
  return drizzleServerless({
    client: migrationPool,
    schema,
  });
}

// Helper to close pool connections (for cleanup)
export async function closeConnections() {
  if (pool) {
    await pool.end();
    pool = null;
    dbPooled = null;
  }
}

// Re-export schema for convenience
export { schema };
