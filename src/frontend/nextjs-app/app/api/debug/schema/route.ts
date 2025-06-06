import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/app/db/drizzle';

export async function GET() {
  try {
    // Check if forecast_adjustments table exists
    const tableExistsResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'forecast_adjustments'
      ) as exists
    `);

    const tableExists = tableExistsResult.rows[0].exists;

    let columns: Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }> = [];
    if (tableExists) {
      // Get column information
      const columnsResult = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'forecast_adjustments'
        ORDER BY ordinal_position
      `);
      columns = columnsResult.rows as Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }>;
    }

    // Check migration status - now checking for Drizzle migrations
    const drizzleMigrationsExist = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
      ) as exists
    `);

    let migrations: Array<{ id: number; hash: string; created_at: string }> = [];
    if (drizzleMigrationsExist.rows[0].exists) {
      const migrationsResult = await db.execute(sql`
        SELECT id, hash, created_at
        FROM drizzle.__drizzle_migrations
        ORDER BY id
      `);
      migrations = migrationsResult.rows as Array<{ id: number; hash: string; created_at: string }>;
    }

    // Also check for legacy migrations table
    const legacyMigrationsExist = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'migrations'
      ) as exists
    `);

    let legacyMigrations: Array<{ id: string; name: string; applied_at: string }> = [];
    if (legacyMigrationsExist.rows[0].exists) {
      const legacyMigrationsResult = await db.execute(sql`
        SELECT id, name, applied_at
        FROM migrations
        ORDER BY id
      `);
      legacyMigrations = legacyMigrationsResult.rows as Array<{ id: string; name: string; applied_at: string }>;
    }

    return NextResponse.json({
      forecast_adjustments_table: {
        exists: tableExists,
        columns: columns
      },
      migrations: {
        drizzle: {
          table_exists: drizzleMigrationsExist.rows[0].exists,
          applied: migrations
        },
        legacy: {
          table_exists: legacyMigrationsExist.rows[0].exists,
          applied: legacyMigrations
        }
      }
    });

  } catch (error) {
    console.error('Error checking database schema:', error);
    return NextResponse.json(
      { error: 'Failed to check database schema', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
