import { db } from '../app/db/drizzle';
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  try {
    console.log('Checking database directly...\n');

    // Test basic connection
    const versionResult = await db.execute(sql`SELECT version()`);
    console.log('PostgreSQL version:', (versionResult.rows[0] as any).version);

    // Check current database
    const dbResult = await db.execute(sql`SELECT current_database()`);
    console.log('Current database:', (dbResult.rows[0] as any).current_database);

    // Check connection info
    const userResult = await db.execute(sql`SELECT current_user`);
    console.log('Connected as user:', (userResult.rows[0] as any).current_user);

    // Count tables
    const tableCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);
    console.log('Number of tables:', (tableCount.rows[0] as any).count);

    // Check specific tables
    const checkTables = ['forecast_adjustments', 'user_preferences', 'summary_cache', 'forecast_data'];

    console.log('\nChecking for expected tables:');
    for (const tableName of checkTables) {
      const exists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = ${tableName}
        ) as exists
      `);
      console.log(`- ${tableName}: ${(exists.rows[0] as any).exists ? '✓' : '✗'}`);
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
