/**
 * API Route for Forecast Cache Operations (Drizzle ORM version)
 *
 * This API route handles all database operations for the forecast cache system,
 * keeping PostgreSQL operations on the server side only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq, gt, and, sql, desc } from 'drizzle-orm';
import { db } from '@/app/db/drizzle';
import { summaryCache, timeseriesCache, queryMetrics } from '@/app/db/schema/forecast-cache';
import { cacheUtils } from '../../../lib/cache-utils';
import { toPostgresDate } from '@/app/lib/date-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const fingerprint = searchParams.get('fingerprint');

    switch (action) {
      case 'get_summary':
        if (!fingerprint) {
          return NextResponse.json({ error: 'Fingerprint required' }, { status: 400 });
        }

        const summaryCacheResult = await db
          .select()
          .from(summaryCache)
          .where(
            and(
              eq(summaryCache.queryFingerprint, fingerprint),
              gt(summaryCache.expiresAt, new Date())
            )
          )
          .orderBy(desc(summaryCache.createdAt))
          .limit(1);

        return NextResponse.json({
          data: summaryCacheResult[0] || null
        });

      case 'get_timeseries':
        if (!fingerprint) {
          return NextResponse.json({ error: 'Fingerprint required' }, { status: 400 });
        }

        const timeseriesCacheResult = await db
          .select()
          .from(timeseriesCache)
          .where(
            and(
              eq(timeseriesCache.queryFingerprint, fingerprint),
              gt(timeseriesCache.expiresAt, new Date())
            )
          )
          .orderBy(desc(timeseriesCache.createdAt))
          .limit(1);

        return NextResponse.json({
          data: timeseriesCacheResult[0] || null
        });

      case 'get_stats':
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Get hit rate metrics
        const metricsResult = await db
          .select({
            cacheHits: sql<number>`COUNT(*) FILTER (WHERE ${queryMetrics.cacheHit} = true)`,
            totalQueries: sql<number>`COUNT(*)`,
            avgTime: sql<number>`AVG(${queryMetrics.executionTimeMs})`,
          })
          .from(queryMetrics)
          .where(gt(queryMetrics.executedAt, twentyFourHoursAgo));

        // Get cache size
        const [summaryCacheSize, timeseriesCacheSize] = await Promise.all([
          db
            .select({ count: sql<number>`COUNT(*)` })
            .from(summaryCache)
            .where(gt(summaryCache.expiresAt, new Date())),
          db
            .select({ count: sql<number>`COUNT(*)` })
            .from(timeseriesCache)
            .where(gt(timeseriesCache.expiresAt, new Date())),
        ]);

        const metrics = metricsResult[0];
        const hitRate = metrics?.totalQueries > 0
          ? (metrics.cacheHits / metrics.totalQueries) * 100
          : 0;

        return NextResponse.json({
          data: {
            hitRate: Math.round(hitRate * 100) / 100,
            totalQueries: metrics?.totalQueries || 0,
            avgResponseTime: Math.round(metrics?.avgTime || 0),
            cacheSize: (summaryCacheSize[0]?.count || 0) + (timeseriesCacheSize[0]?.count || 0),
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Cache API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'cache_summary':
        const { queryType, filters, summaryData } = data;
        const cacheKey = cacheUtils.generateKey(queryType, filters);
        const fingerprint = cacheUtils.generateFingerprint(queryType, filters);
        const ttl = cacheUtils.determineTTL(queryType, filters);
        const expiresAt = cacheUtils.calculateExpires(ttl);

        await db
          .insert(summaryCache)
          .values({
            cacheKey,
            queryFingerprint: fingerprint,
            state: filters.state ? String(filters.state).substring(0, 10) : null,
            data: summaryData,
            expiresAt,
          })
          .onConflictDoUpdate({
            target: summaryCache.cacheKey,
            set: {
              data: summaryData,
              updatedAt: new Date(),
              expiresAt,
            },
          });

        return NextResponse.json({ success: true });

      case 'cache_timeseries':
        const { queryType: tsQueryType, filters: tsFilters, timeseriesData } = data;
        const tsCacheKey = cacheUtils.generateKey(tsQueryType, tsFilters);
        const tsFingerprint = cacheUtils.generateFingerprint(tsQueryType, tsFilters);
        const tsTtl = cacheUtils.determineTTL(tsQueryType, tsFilters);
        const tsExpiresAt = cacheUtils.calculateExpires(tsTtl);

        // Ensure dates are in YYYY-MM-DD format
        const startDate = toPostgresDate(tsFilters.startDate);
        const endDate = toPostgresDate(tsFilters.endDate);

        await db
          .insert(timeseriesCache)
          .values({
            cacheKey: tsCacheKey,
            queryFingerprint: tsFingerprint,
            state: tsFilters.state ? String(tsFilters.state).substring(0, 10) : null,
            startDate,
            endDate,
            data: timeseriesData,
            expiresAt: tsExpiresAt,
          })
          .onConflictDoUpdate({
            target: timeseriesCache.cacheKey,
            set: {
              data: timeseriesData,
              updatedAt: new Date(),
              expiresAt: tsExpiresAt,
            },
          });

        return NextResponse.json({ success: true });

      case 'record_metrics':
        const { metrics } = data;

        await db.insert(queryMetrics).values({
          queryFingerprint: metrics.query_fingerprint,
          queryType: metrics.query_type,
          executionTimeMs: metrics.execution_time_ms,
          dataSource: metrics.data_source,
          cacheHit: metrics.cache_hit,
          errorOccurred: metrics.error_occurred,
          userId: metrics.user_id,
          filters: metrics.filters,
        });

        return NextResponse.json({ success: true });

      case 'increment_hit':
        const { tableName, cacheId } = data;

        if (tableName === 'summary_cache') {
          await db
            .update(summaryCache)
            .set({ hitCount: sql`${summaryCache.hitCount} + 1` })
            .where(eq(summaryCache.id, cacheId));
        } else if (tableName === 'timeseries_cache') {
          await db
            .update(timeseriesCache)
            .set({ hitCount: sql`${timeseriesCache.hitCount} + 1` })
            .where(eq(timeseriesCache.id, cacheId));
        }

        return NextResponse.json({ success: true });

      case 'clear_expired':
        await db.transaction(async (tx) => {
          await tx
            .delete(summaryCache)
            .where(sql`${summaryCache.expiresAt} <= NOW()`);
          await tx
            .delete(timeseriesCache)
            .where(sql`${timeseriesCache.expiresAt} <= NOW()`);
        });

        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Cache API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
