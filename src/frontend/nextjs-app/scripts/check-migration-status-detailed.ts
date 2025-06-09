#!/usr/bin/env tsx

/**
 * Detailed migration status check for workflow dispatch
 */

import { checkMigrationStatus } from '../app/db/migrate';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const environment = process.env.MIGRATION_ENVIRONMENT || 'unknown';
  const branch = process.env.MIGRATION_BRANCH || 'unknown';
  const sanitizedBranch = process.env.MIGRATION_SANITIZED_BRANCH || '';

  try {
    const status = await checkMigrationStatus();

    console.log('### Database Information');
    console.log('- Environment:', environment);
    console.log('- Branch:', branch);
    if (environment === 'preview' && sanitizedBranch) {
      console.log('- Database Branch: branch/' + sanitizedBranch);
    }
    console.log('');

    console.log('### Migration Status');
    console.log('- Has Drizzle migrations table:', status.hasDrizzleMigrations ? '✅ Yes' : '❌ No');
    console.log('- Has legacy migrations table:', status.hasLegacyMigrations ? '⚠️  Yes (consider cleanup)' : '✅ No');
    console.log('- Total migrations applied:', (status as any).migrationsCount || 0);
    console.log('');

    if ((status as any).latestMigration) {
      console.log('### Latest Migration');
      console.log('- Name:', (status as any).latestMigration.name);
      console.log('- Applied at:', new Date((status as any).latestMigration.created_at).toISOString());
    }

    // Check for pending migrations
    const migrationsDir = path.join(process.cwd(), 'drizzle');

    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      console.log('');
      console.log('### Migration Files');
      console.log('- Total SQL files:', files.length);

      if ((status as any).appliedMigrations) {
        const unapplied = files.filter(f => !(status as any).appliedMigrations.includes(f));
        if (unapplied.length > 0) {
          console.log('- ⚠️  Unapplied migrations:', unapplied.length);
          unapplied.forEach(f => console.log('  -', f));
        } else {
          console.log('- ✅ All migrations are applied');
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to check migration status:', (err as Error).message);
    process.exit(1);
  }
}

main();
