import { NextResponse } from 'next/server';
import { db } from '@/app/db/drizzle';
import { sql } from 'drizzle-orm';
import { withAuth } from '@/app/lib/auth-middleware';

export const GET = withAuth(async () => {
  try {
    // Check if the user_preferences table exists using Drizzle
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'user_preferences'
      ) as exists
    `);

    const exists = tableCheck.rows[0]?.exists as boolean;

    if (!exists) {
      // With Drizzle, tables should be created via migrations
      // This endpoint is kept for backward compatibility but shouldn't create tables
      return NextResponse.json({
        message: 'User preferences table does not exist. Please run database migrations.',
        created: false,
        requiresMigration: true
      });
    }

    // Optionally verify the table structure
    const columnCheck = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_preferences'
      ORDER BY ordinal_position
    `);

    return NextResponse.json({
      message: 'User preferences table exists',
      created: false,
      columns: columnCheck.rows
    });
  } catch (error) {
    console.error('Failed to check user preferences table:', error);
    return NextResponse.json(
      { error: 'Failed to check user preferences table' },
      { status: 500 }
    );
  }
});
