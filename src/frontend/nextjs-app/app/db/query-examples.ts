/**
 * Query conversion examples from raw SQL to Drizzle ORM
 * This file demonstrates common query patterns and their Drizzle equivalents
 */

import { db } from './drizzle';
import {
  forecastAdjustments,
  userPreferences,
  summaryCache,
  timeseriesCache,
  queryMetrics
} from './schema';
import { eq, and, desc, lte, sql } from 'drizzle-orm';

// ============================================
// SELECT QUERIES
// ============================================

// Raw SQL: SELECT * FROM forecast_adjustments WHERE user_id = $1
// Drizzle:
const selectByUserId = async (userId: string) => {
  return await db
    .select()
    .from(forecastAdjustments)
    .where(eq(forecastAdjustments.userId, userId));
};

// Raw SQL: SELECT * FROM forecast_adjustments WHERE is_active = true AND user_id = $1 ORDER BY created_at DESC LIMIT 50
// Drizzle:
const selectActiveAdjustments = async (userId: string, limit = 50) => {
  return await db
    .select()
    .from(forecastAdjustments)
    .where(
      and(
        eq(forecastAdjustments.isActive, true),
        eq(forecastAdjustments.userId, userId)
      )
    )
    .orderBy(desc(forecastAdjustments.createdAt))
    .limit(limit);
};

// Raw SQL: SELECT id, adjustment_value, filter_context FROM forecast_adjustments WHERE inventory_item_name = $1
// Drizzle:
const selectSpecificColumns = async (itemName: string) => {
  return await db
    .select({
      id: forecastAdjustments.id,
      adjustmentValue: forecastAdjustments.adjustmentValue,
      filterContext: forecastAdjustments.filterContext,
    })
    .from(forecastAdjustments)
    .where(eq(forecastAdjustments.inventoryItemName, itemName));
};

// ============================================
// INSERT QUERIES
// ============================================

// Raw SQL: INSERT INTO forecast_adjustments (adjustment_value, filter_context, user_id) VALUES ($1, $2, $3) RETURNING *
// Drizzle:
const insertAdjustment = async (adjustmentValue: string, filterContext: Record<string, unknown>, userId: string) => {
  return await db
    .insert(forecastAdjustments)
    .values({
      adjustmentValue,
      filterContext,
      userId,
    })
    .returning();
};

// Insert multiple records
const insertMultipleAdjustments = async (adjustments: Array<Omit<typeof forecastAdjustments.$inferInsert, 'filterContext'> & { filterContext: Record<string, unknown> }>) => {
  return await db
    .insert(forecastAdjustments)
    .values(adjustments)
    .returning();
};

// ============================================
// UPDATE QUERIES
// ============================================

// Raw SQL: UPDATE forecast_adjustments SET is_active = $1 WHERE id = $2 AND user_id = $3
// Drizzle:
const updateAdjustmentStatus = async (isActive: boolean, id: number, userId: string) => {
  return await db
    .update(forecastAdjustments)
    .set({ isActive })
    .where(
      and(
        eq(forecastAdjustments.id, id),
        eq(forecastAdjustments.userId, userId)
      )
    )
    .returning();
};

// Update with dynamic fields
const updateUserPreferencesDynamic = async (userId: string, updates: Partial<typeof userPreferences.$inferInsert>) => {
  return await db
    .update(userPreferences)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(userPreferences.userId, userId))
    .returning();
};

// ============================================
// DELETE QUERIES
// ============================================

// Raw SQL: DELETE FROM forecast_adjustments WHERE id = $1 AND user_id = $2
// Drizzle:
const deleteAdjustment = async (id: number, userId: string) => {
  return await db
    .delete(forecastAdjustments)
    .where(
      and(
        eq(forecastAdjustments.id, id),
        eq(forecastAdjustments.userId, userId)
      )
    );
};

// ============================================
// COMPLEX QUERIES
// ============================================

// JSON operations - filter by JSONB field
// Raw SQL: SELECT * FROM forecast_adjustments WHERE filter_context->>'state' = $1
// Drizzle:
const selectByJsonField = async (state: string) => {
  return await db
    .select()
    .from(forecastAdjustments)
    .where(sql`${forecastAdjustments.filterContext}->>'state' = ${state}`);
};

// Aggregate queries
// Raw SQL: SELECT COUNT(*) as count, AVG(adjustment_value) as avg_adjustment FROM forecast_adjustments WHERE user_id = $1
// Drizzle:
const getAdjustmentStats = async (userId: string) => {
  return await db
    .select({
      count: sql<number>`count(*)::int`,
      avgAdjustment: sql<number>`avg(${forecastAdjustments.adjustmentValue}::numeric)`,
    })
    .from(forecastAdjustments)
    .where(eq(forecastAdjustments.userId, userId));
};

// Join operations (if we had relations defined)
// Raw SQL: SELECT fa.*, up.has_completed_tour FROM forecast_adjustments fa JOIN user_preferences up ON fa.user_id = up.user_id
// Drizzle:
const selectWithJoin = async () => {
  return await db
    .select({
      adjustment: forecastAdjustments,
      hasCompletedTour: userPreferences.hasCompletedTour,
    })
    .from(forecastAdjustments)
    .innerJoin(
      userPreferences,
      eq(forecastAdjustments.userId, userPreferences.userId)
    );
};

// ============================================
// TRANSACTION EXAMPLE
// ============================================

// Using transactions for multiple operations
const createAdjustmentWithMetrics = async (
  adjustment: typeof forecastAdjustments.$inferInsert,
  executionTimeMs: number
) => {
  return await db.transaction(async (tx) => {
    // Insert the adjustment
    const [newAdjustment] = await tx
      .insert(forecastAdjustments)
      .values(adjustment)
      .returning();

    // Log the query metrics
    await tx
      .insert(queryMetrics)
      .values({
        queryFingerprint: 'create_adjustment',
        queryType: 'insert',
        executionTimeMs,
        dataSource: 'postgres',
        cacheHit: false,
        errorOccurred: false,
        userId: adjustment.userId,
      });

    return newAdjustment;
  });
};

// ============================================
// UPSERT (INSERT ON CONFLICT)
// ============================================

// Raw SQL: INSERT INTO user_preferences (user_id, has_seen_welcome) VALUES ($1, $2)
//          ON CONFLICT (user_id) DO UPDATE SET has_seen_welcome = $2
// Drizzle:
const upsertUserPreference = async (userId: string, hasSeenWelcome: boolean) => {
  return await db
    .insert(userPreferences)
    .values({
      userId,
      hasSeenWelcome,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { hasSeenWelcome },
    })
    .returning();
};

// ============================================
// CACHE-SPECIFIC PATTERNS
// ============================================

// Check and update cache hit count
const incrementCacheHit = async (cacheKey: string) => {
  return await db
    .update(summaryCache)
    .set({
      hitCount: sql`${summaryCache.hitCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(summaryCache.cacheKey, cacheKey))
    .returning();
};

// Clean expired cache entries
const cleanExpiredCache = async () => {
  const now = new Date();

  await db.transaction(async (tx) => {
    // Delete from summary cache
    await tx
      .delete(summaryCache)
      .where(lte(summaryCache.expiresAt, now));

    // Delete from timeseries cache
    await tx
      .delete(timeseriesCache)
      .where(lte(timeseriesCache.expiresAt, now));
  });
};

// Export example functions for reference
export const queryExamples = {
  selectByUserId,
  selectActiveAdjustments,
  selectSpecificColumns,
  insertAdjustment,
  insertMultipleAdjustments,
  updateAdjustmentStatus,
  updateUserPreferencesDynamic,
  deleteAdjustment,
  selectByJsonField,
  getAdjustmentStats,
  selectWithJoin,
  createAdjustmentWithMetrics,
  upsertUserPreference,
  incrementCacheHit,
  cleanExpiredCache,
};
