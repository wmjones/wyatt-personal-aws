import { NextResponse } from 'next/server';
import { query } from '@/app/lib/postgres';
import { withAuth, AuthenticatedRequest } from '@/app/lib/auth-middleware';

interface UserPreferences {
  id: number;
  user_id: string;
  has_seen_welcome: boolean;
  has_completed_tour: boolean;
  tour_progress: Record<string, unknown>;
  onboarding_completed_at: string | null;
  tooltips_enabled: boolean;
  preferred_help_format: string;
  created_at: string;
  updated_at: string;
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.user?.sub;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    // Try to get existing preferences
    const result = await query<UserPreferences>(`
      SELECT * FROM user_preferences WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      // Create default preferences if none exist
      const createResult = await query<UserPreferences>(`
        INSERT INTO user_preferences (user_id)
        VALUES ($1)
        RETURNING *
      `, [userId]);

      return NextResponse.json({
        preferences: createResult.rows[0]
      });
    }

    return NextResponse.json({
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.user?.sub;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      has_seen_welcome,
      has_completed_tour,
      tour_progress,
      onboarding_completed_at,
      tooltips_enabled,
      preferred_help_format
    } = body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (has_seen_welcome !== undefined) {
      updates.push(`has_seen_welcome = $${paramCount++}`);
      values.push(has_seen_welcome);
    }

    if (has_completed_tour !== undefined) {
      updates.push(`has_completed_tour = $${paramCount++}`);
      values.push(has_completed_tour);
    }

    if (tour_progress !== undefined) {
      updates.push(`tour_progress = $${paramCount++}`);
      values.push(JSON.stringify(tour_progress));
    }

    if (onboarding_completed_at !== undefined) {
      updates.push(`onboarding_completed_at = $${paramCount++}`);
      values.push(onboarding_completed_at);
    }

    if (tooltips_enabled !== undefined) {
      updates.push(`tooltips_enabled = $${paramCount++}`);
      values.push(tooltips_enabled);
    }

    if (preferred_help_format !== undefined) {
      updates.push(`preferred_help_format = $${paramCount++}`);
      values.push(preferred_help_format);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add user_id as the last parameter
    values.push(userId);

    const result = await query<UserPreferences>(`
      UPDATE user_preferences
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      // If no rows updated, create new preferences
      const createResult = await query<UserPreferences>(`
        INSERT INTO user_preferences (
          user_id,
          has_seen_welcome,
          has_completed_tour,
          tour_progress,
          onboarding_completed_at,
          tooltips_enabled,
          preferred_help_format
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        userId,
        has_seen_welcome ?? false,
        has_completed_tour ?? false,
        JSON.stringify(tour_progress ?? {}),
        onboarding_completed_at ?? null,
        tooltips_enabled ?? true,
        preferred_help_format ?? 'text'
      ]);

      return NextResponse.json({
        preferences: createResult.rows[0]
      });
    }

    return NextResponse.json({
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
});
