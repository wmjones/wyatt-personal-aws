import { config } from './config';

// Database connection configuration
export const dbConfig = {
  connectionString: config.database.url,
  connectionStringUnpooled: config.database.urlUnpooled,

  // Helper to get the appropriate connection string
  getConnectionString(pooled: boolean = true): string | undefined {
    return pooled ? this.connectionString : this.connectionStringUnpooled;
  },

  // Check if database is configured
  isConfigured(): boolean {
    return !!(this.connectionString || this.connectionStringUnpooled);
  },

  // Get connection options for different libraries
  getConnectionOptions() {
    return {
      // For Prisma
      prisma: {
        url: this.connectionString,
        directUrl: this.connectionStringUnpooled,
      },

      // For node-postgres
      pg: {
        connectionString: this.connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
      },

      // For Drizzle
      drizzle: {
        connectionString: this.connectionString,
        ssl: true,
      },
    };
  },
};

// Export helper functions
export function getDatabaseUrl(pooled: boolean = true): string {
  const url = dbConfig.getConnectionString(pooled);
  if (!url) {
    throw new Error('Database URL not configured');
  }
  return url;
}

export function isDatabaseConfigured(): boolean {
  return dbConfig.isConfigured();
}
