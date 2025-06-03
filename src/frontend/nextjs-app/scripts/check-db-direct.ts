import { query } from '../app/lib/postgres';

async function checkDatabase() {
  try {
    console.log('Checking database schema...\n');

    // Check if forecast_adjustments table exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'forecast_adjustments'
      ) as exists
    `);

    console.log('forecast_adjustments table exists:', tableExists.rows[0].exists);

    if (tableExists.rows[0].exists) {
      // Get column information
      const columns = await query(`
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

    // Check migration status
    const migrationsExist = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'migrations'
      ) as exists
    `);

    if (migrationsExist.rows[0].exists) {
      const migrations = await query(`
        SELECT id, name, applied_at
        FROM migrations
        ORDER BY id
      `);

      console.log('\n\nApplied migrations:');
      migrations.rows.forEach((m: any) => {
        console.log(`- ${m.id}: ${m.name} (applied at ${m.applied_at})`);
      });
    } else {
      console.log('\n\nMigrations table does not exist');
    }

  } catch (error) {
    console.error('Error checking database schema:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
