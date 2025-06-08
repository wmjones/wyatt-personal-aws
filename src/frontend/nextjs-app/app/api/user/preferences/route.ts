import { NextResponse } from 'next/server';
import { db } from '@/app/db/drizzle';
import { userPreferences } from '@/app/db/schema';
import { withAuth, AuthenticatedRequest } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

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
    const [existingPreferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (!existingPreferences) {
      // Create default preferences if none exist
      const [newPreferences] = await db
        .insert(userPreferences)
        .values({
          userId,
        })
        .returning();

      return NextResponse.json({
        preferences: {
          ...newPreferences,
          // Convert back to snake_case for API compatibility
          has_seen_welcome: newPreferences.hasSeenWelcome,
          has_completed_tour: newPreferences.hasCompletedTour,
          tour_progress: newPreferences.tourProgress,
          onboarding_completed_at: newPreferences.onboardingCompletedAt,
          tooltips_enabled: newPreferences.tooltipsEnabled,
          preferred_help_format: newPreferences.preferredHelpFormat,
          user_id: newPreferences.userId,
          created_at: newPreferences.createdAt,
          updated_at: newPreferences.updatedAt,
        }
      });
    }

    return NextResponse.json({
      preferences: {
        ...existingPreferences,
        // Convert back to snake_case for API compatibility
        has_seen_welcome: existingPreferences.hasSeenWelcome,
        has_completed_tour: existingPreferences.hasCompletedTour,
        tour_progress: existingPreferences.tourProgress,
        onboarding_completed_at: existingPreferences.onboardingCompletedAt,
        tooltips_enabled: existingPreferences.tooltipsEnabled,
        preferred_help_format: existingPreferences.preferredHelpFormat,
        user_id: existingPreferences.userId,
        created_at: existingPreferences.createdAt,
        updated_at: existingPreferences.updatedAt,
      }
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

    // Build update object dynamically
    const updateData: Partial<typeof userPreferences.$inferInsert> = {};

    if (has_seen_welcome !== undefined) {
      updateData.hasSeenWelcome = has_seen_welcome;
    }

    if (has_completed_tour !== undefined) {
      updateData.hasCompletedTour = has_completed_tour;
    }

    if (tour_progress !== undefined) {
      updateData.tourProgress = tour_progress;
    }

    if (onboarding_completed_at !== undefined) {
      updateData.onboardingCompletedAt = onboarding_completed_at ? new Date(onboarding_completed_at) : null;
    }

    if (tooltips_enabled !== undefined) {
      updateData.tooltipsEnabled = tooltips_enabled;
    }

    if (preferred_help_format !== undefined) {
      updateData.preferredHelpFormat = preferred_help_format;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Try to update existing preferences
    const updatedRows = await db
      .update(userPreferences)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (updatedRows.length === 0) {
      // If no rows updated, create new preferences
      const [newPreferences] = await db
        .insert(userPreferences)
        .values({
          userId,
          hasSeenWelcome: has_seen_welcome ?? false,
          hasCompletedTour: has_completed_tour ?? false,
          tourProgress: tour_progress ?? {},
          onboardingCompletedAt: onboarding_completed_at ? new Date(onboarding_completed_at) : null,
          tooltipsEnabled: tooltips_enabled ?? true,
          preferredHelpFormat: preferred_help_format ?? 'text',
        })
        .returning();

      return NextResponse.json({
        preferences: {
          ...newPreferences,
          // Convert back to snake_case for API compatibility
          has_seen_welcome: newPreferences.hasSeenWelcome,
          has_completed_tour: newPreferences.hasCompletedTour,
          tour_progress: newPreferences.tourProgress,
          onboarding_completed_at: newPreferences.onboardingCompletedAt,
          tooltips_enabled: newPreferences.tooltipsEnabled,
          preferred_help_format: newPreferences.preferredHelpFormat,
          user_id: newPreferences.userId,
          created_at: newPreferences.createdAt,
          updated_at: newPreferences.updatedAt,
        }
      });
    }

    return NextResponse.json({
      preferences: {
        ...updatedRows[0],
        // Convert back to snake_case for API compatibility
        has_seen_welcome: updatedRows[0].hasSeenWelcome,
        has_completed_tour: updatedRows[0].hasCompletedTour,
        tour_progress: updatedRows[0].tourProgress,
        onboarding_completed_at: updatedRows[0].onboardingCompletedAt,
        tooltips_enabled: updatedRows[0].tooltipsEnabled,
        preferred_help_format: updatedRows[0].preferredHelpFormat,
        user_id: updatedRows[0].userId,
        created_at: updatedRows[0].createdAt,
        updated_at: updatedRows[0].updatedAt,
      }
    });
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
});
