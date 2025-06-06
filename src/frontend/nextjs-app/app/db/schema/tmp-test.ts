import { pgTable, serial, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * Temporary test table for verifying Drizzle migration
 * This table can be removed after testing
 */
export const tmpDrizzleTest = pgTable('tmp_drizzle_test', {
  id: serial('id').primaryKey(),
  testName: varchar('test_name', { length: 255 }).notNull(),
  testValue: varchar('test_value', { length: 1000 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type TmpDrizzleTest = typeof tmpDrizzleTest.$inferSelect;
export type NewTmpDrizzleTest = typeof tmpDrizzleTest.$inferInsert;
