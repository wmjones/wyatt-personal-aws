import { NextResponse } from 'next/server';
import { query } from '@/app/lib/postgres';

export async function GET() {
  try {
    // Check if forecast_adjustments table exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'forecast_adjustments'
      ) as exists
    `);

    const tableExistsResult = tableExists.rows[0].exists;

    let columns: Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }> = [];
    if (tableExistsResult) {
      // Get column information
      const columnsResult = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'forecast_adjustments'
        ORDER BY ordinal_position
      `);
      columns = columnsResult.rows;
    }

    // Check migration status
    const migrationsExist = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'migrations'
      ) as exists
    `);

    let migrations: Array<{ id: string; name: string; applied_at: string }> = [];
    if (migrationsExist.rows[0].exists) {
      const migrationsResult = await query(`
        SELECT id, name, applied_at
        FROM migrations
        ORDER BY id
      `);
      migrations = migrationsResult.rows;
    }

    return NextResponse.json({
      forecast_adjustments_table: {
        exists: tableExistsResult,
        columns: columns
      },
      migrations: {
        table_exists: migrationsExist.rows[0].exists,
        applied: migrations
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
