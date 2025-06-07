import { db } from '../app/db/drizzle';
import { sql } from 'drizzle-orm';

async function checkDatabaseSchema() {
  try {
    console.log('Checking database schema...\n');

    // Check if forecast_adjustments table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'forecast_adjustments'
      ) as exists
    `);

    console.log('forecast_adjustments table exists:', (tableExists.rows[0] as any).exists);

    if ((tableExists.rows[0] as any).exists) {
      // Get column information
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'forecast_adjustments'
        ORDER BY ordinal_position
      `);

      console.log('\nColumns in forecast_adjustments table:');
      columns.rows.forEach((col: any) => {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    }

    // Check Drizzle migrations
    const drizzleExist = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = '__drizzle_migrations'
      ) as exists
    `);

    if ((drizzleExist.rows[0] as any).exists) {
      const migrations = await db.execute(sql`
        SELECT id, hash, created_at
        FROM __drizzle_migrations
        ORDER BY id
      `);

      console.log('\n\nApplied Drizzle migrations:');
      migrations.rows.forEach((m: any) => {
        console.log(`- ${m.id}: ${m.hash} (applied at ${m.created_at})`);
      });
    }

    // Check for other important tables
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('\n\nAll tables in database:');
    tables.rows.forEach((t: any) => {
      console.log(`- ${t.table_name}`);
    });

  } catch (error) {
    console.error('Error checking database schema:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabaseSchema();
