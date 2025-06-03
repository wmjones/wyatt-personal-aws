import { NextResponse } from 'next/server';
import { runMigrations, getMigrationStatus } from '@/app/lib/migrations';
import { withAuth, AuthenticatedRequest } from '@/app/lib/auth-middleware';

export const GET = withAuth(async (_request: AuthenticatedRequest) => {
  try {
    // Get current migration status
    const status = await getMigrationStatus();

    return NextResponse.json({
      status
    });
  } catch (error) {
    console.error('Error getting migration status:', error);
    return NextResponse.json(
      { error: 'Failed to get migration status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (_request: AuthenticatedRequest) => {
  try {
    // Run pending migrations
    await runMigrations();

    // Get updated status
    const status = await getMigrationStatus();

    return NextResponse.json({
      success: true,
      message: 'Migrations completed successfully',
      status
    });
  } catch (error) {
    console.error('Error running migrations:', error);
    return NextResponse.json(
      { error: 'Failed to run migrations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
