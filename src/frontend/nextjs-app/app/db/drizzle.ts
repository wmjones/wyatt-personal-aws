import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzleServerless } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_UNPOOLED;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
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
