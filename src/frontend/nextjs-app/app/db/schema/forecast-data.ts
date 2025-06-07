import { pgTable, serial, integer, date, varchar, decimal, index } from 'drizzle-orm/pg-core';

// Forecast data table
export const forecastData = pgTable('forecast_data', {
  id: serial('id').primaryKey(),
  restaurantId: integer('restaurant_id').notNull(),
  inventoryItemId: integer('inventory_item_id').notNull(),
  businessDate: date('business_date').notNull(),
  dmaId: varchar('dma_id', { length: 50 }),
  dcId: integer('dc_id'),
  state: varchar('state', { length: 50 }),
  y05: decimal('y_05', { precision: 10, scale: 2 }),
  y50: decimal('y_50', { precision: 10, scale: 2 }),
  y95: decimal('y_95', { precision: 10, scale: 2 }),
}, (table) => ({
  businessDateIdx: index('idx_forecast_business_date').on(table.businessDate),
  inventoryItemIdx: index('idx_forecast_inventory_item').on(table.inventoryItemId),
  stateIdx: index('idx_forecast_state').on(table.state),
  dmaIdx: index('idx_forecast_dma').on(table.dmaId),
  dcIdx: index('idx_forecast_dc').on(table.dcId),
  compositeIdx: index('idx_forecast_composite').on(
    table.inventoryItemId,
    table.businessDate,
    table.state,
    table.dmaId
  ),
}));

// Materialized view for dashboard forecast (if needed)
export const dashboardForecastView = pgTable('dashboard_forecast_view', {
  restaurantId: integer('restaurant_id'),
  inventoryItemId: integer('inventory_item_id'),
  businessDate: date('business_date'),
  dmaId: varchar('dma_id', { length: 50 }),
  dcId: integer('dc_id'),
  state: varchar('state', { length: 50 }),
  y05: decimal('y_05', { precision: 10, scale: 2 }),
  y50: decimal('y_50', { precision: 10, scale: 2 }),
  y95: decimal('y_95', { precision: 10, scale: 2 }),
});

// Type exports
export type ForecastData = typeof forecastData.$inferSelect;
export type NewForecastData = typeof forecastData.$inferInsert;
export type DashboardForecastView = typeof dashboardForecastView.$inferSelect;
