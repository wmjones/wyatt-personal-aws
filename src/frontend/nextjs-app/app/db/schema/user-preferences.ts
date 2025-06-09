import { pgTable, serial, varchar, timestamp, boolean, json, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// User preferences table
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  hasSeenWelcome: boolean('has_seen_welcome').default(false).notNull(),
  hasCompletedTour: boolean('has_completed_tour').default(false).notNull(),
  tourProgress: json('tour_progress').default({}).notNull(),
  onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
  tooltipsEnabled: boolean('tooltips_enabled').default(true).notNull(),
  preferredHelpFormat: varchar('preferred_help_format', { length: 20 }).default('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_user_preferences_user_id').on(table.userId),
  onboardingIdx: index('idx_user_preferences_onboarding').on(table.hasSeenWelcome, table.hasCompletedTour),
}));

// Type exports for TypeScript inference
export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;

// Helper function to create the update trigger (to be used in migrations)
export const updateUserPreferencesUpdatedAtTrigger = sql`
  CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER user_preferences_updated_at_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();
`;
