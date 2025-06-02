import { NextResponse } from 'next/server';
import { query } from '@/app/lib/postgres';
import { withAuth } from '@/app/lib/auth-middleware';

export const GET = withAuth(async () => {
  try {
    // Check if the user_preferences table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'user_preferences'
      ) as exists
    `);

    if (!tableCheck.rows[0]?.exists) {
      // Create the table if it doesn't exist
      await query(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) UNIQUE NOT NULL,
          has_seen_welcome BOOLEAN DEFAULT FALSE,
          has_completed_tour BOOLEAN DEFAULT FALSE,
          tour_progress JSON DEFAULT '{}',
          onboarding_completed_at TIMESTAMP WITH TIME ZONE,
          tooltips_enabled BOOLEAN DEFAULT TRUE,
          preferred_help_format VARCHAR(20) DEFAULT 'text',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_preferences_onboarding ON user_preferences(has_seen_welcome, has_completed_tour);

        -- Create trigger to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS user_preferences_updated_at_trigger ON user_preferences;
        CREATE TRIGGER user_preferences_updated_at_trigger
        BEFORE UPDATE ON user_preferences
        FOR EACH ROW
        EXECUTE FUNCTION update_user_preferences_updated_at();
      `);

      return NextResponse.json({
        message: 'User preferences table created successfully',
        created: true
      });
    }

    return NextResponse.json({
      message: 'User preferences table already exists',
      created: false
    });
  } catch (error) {
    console.error('Failed to initialize user preferences table:', error);
    return NextResponse.json(
      { error: 'Failed to initialize user preferences table' },
      { status: 500 }
    );
  }
});
