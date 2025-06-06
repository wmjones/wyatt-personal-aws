import { pgTable, serial, varchar, timestamp, jsonb, index, boolean, decimal } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Forecast adjustments table
export const forecastAdjustments = pgTable('forecast_adjustments', {
  id: serial('id').primaryKey(),
  adjustmentValue: decimal('adjustment_value', { precision: 5, scale: 2 }).notNull(),
  filterContext: jsonb('filter_context').notNull(),
  inventoryItemName: varchar('inventory_item_name', { length: 255 }),
  userId: varchar('user_id', { length: 255 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }),
  userName: varchar('user_name', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index('idx_forecast_adjustments_created_at').on(table.createdAt.desc()),
  inventoryItemIdx: index('idx_forecast_adjustments_inventory_item').on(table.inventoryItemName),
  filterContextIdx: index('idx_forecast_adjustments_filter_context').using('gin', table.filterContext),
  userIdIdx: index('idx_forecast_adjustments_user_id').on(table.userId),
  isActiveIdx: index('idx_forecast_adjustments_is_active').on(table.isActive),
  userEmailIdx: index('idx_forecast_adjustments_user_email').on(table.userEmail),
}));

// Type exports for TypeScript inference
export type ForecastAdjustment = typeof forecastAdjustments.$inferSelect;
export type NewForecastAdjustment = typeof forecastAdjustments.$inferInsert;

// Helper function to create the update trigger (to be used in migrations)
export const updateAdjustmentsUpdatedAtTrigger = sql`
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  CREATE TRIGGER update_forecast_adjustments_updated_at
    BEFORE UPDATE ON forecast_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;
