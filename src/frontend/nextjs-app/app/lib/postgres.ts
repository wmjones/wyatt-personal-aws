/**
 * PostgreSQL connection utility for Neon database
 *
 * This module provides connection utilities for interacting with
 * the Neon PostgreSQL database used for forecast data caching.
 */

import { Pool, Client, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { config } from './config';

// Connection pool for efficient database connections
let pool: Pool | null = null;

/**
 * Database connection configuration
 */
const getConnectionConfig = (usePooled: boolean = true): PoolConfig => {
  const connectionString = usePooled
    ? config.database.url
    : config.database.urlUnpooled;

  if (!connectionString) {
    throw new Error('Database connection string not configured');
  }

  return {
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for Neon
    },
    // Connection pool settings
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
    connectionTimeoutMillis: 2000, // How long to wait when connecting a client
  };
};

/**
 * Get or create a connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(getConnectionConfig(true));

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

/**
 * Execute a query using the connection pool
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = getPool();
  try {
    return await client.query<T>(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a query with a dedicated client (for transactions)
 */
export async function queryWithClient<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<{ result: QueryResult<T>; client: Client }> {
  const client = new Client(getConnectionConfig(false));

  try {
    await client.connect();
    const result = await client.query<T>(text, params);
    return { result, client };
  } catch (error) {
    await client.end();
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const client = new Client(getConnectionConfig(false));

  try {
    await client.connect();
    await client.query('BEGIN');

    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Test the database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Database utility functions for common operations
 */
export const db = {
  // Query with parameters
  query: query,

  // Transaction wrapper
  transaction: transaction,

  // Test connection
  test: testConnection,

  // Get pool instance
  getPool: getPool,

  // Close connections
  close: closePool,
};

// Export types for use in other modules
export type { QueryResult, Pool, Client } from 'pg';
