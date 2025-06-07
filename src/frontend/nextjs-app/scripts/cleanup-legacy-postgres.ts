/**
 * Cleanup script to remove legacy postgres code after Drizzle migration
 *
 * This script will:
 * 1. Remove .legacy.ts files from API routes
 * 2. Remove the old lib/postgres.ts file
 * 3. Update imports that reference legacy code
 *
 * Usage: npx tsx scripts/cleanup-legacy-postgres.ts [--dry-run]
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');

console.log(`\n🧹 Legacy Postgres Code Cleanup`);
console.log(`📍 Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE (files will be deleted)'}`);
console.log(`⏰ Starting at: ${new Date().toISOString()}\n`);

interface FileToRemove {
  path: string;
  type: 'legacy-route' | 'postgres-lib' | 'migration-util';
}

async function findLegacyFiles(): Promise<FileToRemove[]> {
  const files: FileToRemove[] = [];

  // Find all .legacy.ts files in API routes
  const legacyRoutes = await glob('app/api/**/*.legacy.ts');
  legacyRoutes.forEach((path: string) => {
    files.push({ path, type: 'legacy-route' });
  });

  // Check for lib/postgres.ts
  const postgresLib = 'app/lib/postgres.ts';
  try {
    await fs.access(postgresLib);
    files.push({ path: postgresLib, type: 'postgres-lib' });
  } catch {
    // File doesn't exist, that's ok
  }

  // Check for old migration utilities
  const migrationUtils = [
    'app/lib/db.ts',
    'scripts/migrations/**/*.ts',
  ];

  for (const pattern of migrationUtils) {
    const matches = await glob(pattern);
    matches.forEach((path: string) => {
      files.push({ path, type: 'migration-util' });
    });
  }

  return files;
}

async function checkForImports(files: FileToRemove[]): Promise<string[]> {
  const issues: string[] = [];

  // Check for imports of postgres.ts
  const tsFiles = await glob('**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/*.legacy.ts', 'scripts/**'],
  });

  for (const file of tsFiles) {
    const content = await fs.readFile(file, 'utf-8');

    // Check for postgres imports
    if (content.includes("from '@/app/lib/postgres'") ||
        content.includes('from "../lib/postgres"') ||
        content.includes('from "./lib/postgres"')) {
      issues.push(`${file} - imports from lib/postgres`);
    }

    // Check for legacy route imports
    for (const legacyFile of files.filter(f => f.type === 'legacy-route')) {
      const importPath = legacyFile.path.replace('.ts', '');
      if (content.includes(importPath)) {
        issues.push(`${file} - imports from ${legacyFile.path}`);
      }
    }
  }

  return issues;
}

async function removeFiles(files: FileToRemove[]): Promise<void> {
  for (const file of files) {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would remove: ${file.path}`);
    } else {
      try {
        await fs.unlink(file.path);
        console.log(`✅ Removed: ${file.path}`);
      } catch (error) {
        console.error(`❌ Failed to remove ${file.path}:`, error);
      }
    }
  }
}

async function main() {
  // Step 1: Find legacy files
  console.log('📋 Step 1: Finding legacy files...\n');
  const legacyFiles = await findLegacyFiles();

  console.log(`Found ${legacyFiles.length} legacy files:`);
  legacyFiles.forEach(file => {
    console.log(`  - ${file.path} (${file.type})`);
  });

  if (legacyFiles.length === 0) {
    console.log('\n✅ No legacy files found! Cleanup may have already been completed.');
    return;
  }

  // Step 2: Check for imports
  console.log('\n📋 Step 2: Checking for imports of legacy code...\n');
  const importIssues = await checkForImports(legacyFiles);

  if (importIssues.length > 0) {
    console.log(`⚠️  Found ${importIssues.length} files still importing legacy code:\n`);
    importIssues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
    console.log('\n❌ Please update these imports before running cleanup!');
    process.exit(1);
  } else {
    console.log('✅ No imports of legacy code found');
  }

  // Step 3: Remove files
  console.log('\n📋 Step 3: Removing legacy files...\n');
  await removeFiles(legacyFiles);

  // Summary
  console.log('\n📊 Cleanup Summary\n');
  console.log('=====================================');

  if (DRY_RUN) {
    console.log(`🔍 DRY RUN COMPLETE`);
    console.log(`Would remove ${legacyFiles.length} files`);
    console.log(`\nTo actually remove files, run without --dry-run flag:`);
    console.log(`  npx tsx scripts/cleanup-legacy-postgres.ts`);
  } else {
    console.log(`✅ CLEANUP COMPLETE`);
    console.log(`Removed ${legacyFiles.length} legacy files`);
    console.log(`\nNext steps:`);
    console.log(`1. Run tests to ensure everything still works`);
    console.log(`2. Commit the cleanup changes`);
    console.log(`3. Deploy and verify in preview/production`);
  }

  // Additional recommendations
  console.log('\n💡 Additional Cleanup Recommendations:\n');
  console.log('1. Remove postgres-related dependencies from package.json:');
  console.log('   - pg (if not used by Drizzle)');
  console.log('   - @types/pg (if not used by Drizzle)');
  console.log('');
  console.log('2. Update documentation to remove references to:');
  console.log('   - Raw SQL queries');
  console.log('   - lib/postgres.ts');
  console.log('   - Legacy migration system');
}

main().catch(error => {
  console.error('Cleanup script failed:', error);
  process.exit(1);
});
