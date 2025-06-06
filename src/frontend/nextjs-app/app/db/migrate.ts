import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { getMigrationDb } from './drizzle';
import { migrations as legacyMigrationsTable } from './schema/migrations';
import { eq } from 'drizzle-orm';
import path from 'path';

/**
 * Run Drizzle migrations and track them in the legacy migrations table
 * for compatibility with the existing system
 */
export async function runMigrations() {
  console.log('Running database migrations...');

  const db = getMigrationDb();

  try {
    // Run Drizzle migrations
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), 'drizzle'),
      migrationsTable: 'drizzle_migrations',
    });

    console.log('✅ Drizzle migrations completed successfully');

    // Track in legacy migrations table for compatibility
    // This ensures the old system knows migrations have been applied
    const migrationRecord = {
      id: 'drizzle',
      name: 'drizzle_orm_migration',
      appliedAt: new Date(),
    };

    // Check if already tracked
    const existing = await db
      .select()
      .from(legacyMigrationsTable)
      .where(eq(legacyMigrationsTable.id, 'drizzle'))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(legacyMigrationsTable).values(migrationRecord);
      console.log('✅ Migration tracked in legacy system');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Check migration status
 */
export async function checkMigrationStatus() {
  const db = getMigrationDb();

  try {
    // Check Drizzle migrations table
    const result = await db.execute(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'drizzle_migrations'
    `);

    const hasDrizzleMigrations = result.rows.length > 0;

    // Check legacy migrations table
    const legacyResult = await db.execute(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'migrations'
    `);

    const hasLegacyMigrations = legacyResult.rows.length > 0;

    return {
      hasDrizzleMigrations,
      hasLegacyMigrations,
      needsMigration: !hasDrizzleMigrations,
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      hasDrizzleMigrations: false,
      hasLegacyMigrations: false,
      needsMigration: true,
    };
  }
}

// Export for use in scripts
export default runMigrations;
