import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core';

// Legacy migrations tracking table (for compatibility)
export const migrations = pgTable('migrations', {
  id: varchar('id', { length: 10 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type exports for TypeScript inference
export type Migration = typeof migrations.$inferSelect;
export type NewMigration = typeof migrations.$inferInsert;
