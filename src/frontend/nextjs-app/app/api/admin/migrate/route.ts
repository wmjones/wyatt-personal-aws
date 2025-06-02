/**
 * Database Migration API Route
 *
 * This endpoint allows running database migrations remotely.
 * Should be secured and only used by administrators.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, getMigrationStatus } from '../../../lib/migrations';

export async function POST(request: NextRequest) {
  try {
    // Simple authorization check (you should replace this with proper auth)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.MIGRATION_SECRET || 'dev-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting database migrations via API...');

    // Check current status
    const beforeStatus = await getMigrationStatus();
    console.log(`Applied: ${beforeStatus.applied.length}, Pending: ${beforeStatus.pending.length}`);

    if (beforeStatus.pending.length === 0) {
      return NextResponse.json({
        message: 'No pending migrations',
        status: beforeStatus
      });
    }

    // Run migrations
    await runMigrations();

    // Check final status
    const afterStatus = await getMigrationStatus();

    return NextResponse.json({
      message: 'Migrations completed successfully',
      before: beforeStatus,
      after: afterStatus,
      migrationsRun: beforeStatus.pending.length
    });

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Simple authorization check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.MIGRATION_SECRET || 'dev-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getMigrationStatus();

    return NextResponse.json({
      status,
      needsMigration: status.pending.length > 0
    });

  } catch (error) {
    console.error('Migration status API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get migration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
