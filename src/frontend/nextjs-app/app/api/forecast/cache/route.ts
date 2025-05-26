/**
 * API Route for Forecast Cache Operations
 *
 * This API route handles all database operations for the forecast cache system,
 * keeping PostgreSQL operations on the server side only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, db } from '../../../lib/postgres';
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

        const summaryResult = await query(`
          SELECT id, cache_key, query_fingerprint, data, created_at, updated_at, expires_at, hit_count
          FROM forecast_cache.summary_cache
          WHERE query_fingerprint = $1 AND expires_at > NOW()
          ORDER BY created_at DESC
          LIMIT 1
        `, [fingerprint]);

        return NextResponse.json({
          data: summaryResult.rows[0] || null
        });

      case 'get_timeseries':
        if (!fingerprint) {
          return NextResponse.json({ error: 'Fingerprint required' }, { status: 400 });
        }

        const timeseriesResult = await query(`
          SELECT id, cache_key, query_fingerprint, data, created_at, updated_at, expires_at, hit_count
          FROM forecast_cache.timeseries_cache
          WHERE query_fingerprint = $1 AND expires_at > NOW()
          ORDER BY created_at DESC
          LIMIT 1
        `, [fingerprint]);

        return NextResponse.json({
          data: timeseriesResult.rows[0] || null
        });

      case 'get_stats':
        const [hitRateResult, avgTimeResult, cacheSizeResult] = await Promise.all([
          query<{ cache_hits: string; total_queries: string }>(`
            SELECT
              COUNT(*) FILTER (WHERE cache_hit = true) as cache_hits,
              COUNT(*) as total_queries
            FROM forecast_cache.query_metrics
            WHERE executed_at > NOW() - INTERVAL '24 hours'
          `),
          query<{ avg_time: string }>(`
            SELECT AVG(execution_time_ms) as avg_time
            FROM forecast_cache.query_metrics
            WHERE executed_at > NOW() - INTERVAL '24 hours'
          `),
          query<{ cache_size: string }>(`
            SELECT
              (SELECT COUNT(*) FROM forecast_cache.summary_cache WHERE expires_at > NOW()) +
              (SELECT COUNT(*) FROM forecast_cache.timeseries_cache WHERE expires_at > NOW()) as cache_size
          `)
        ]);

        const hitData = hitRateResult.rows[0];
        const hitRate = hitData?.total_queries && parseInt(hitData.total_queries) > 0
          ? (parseInt(hitData.cache_hits) / parseInt(hitData.total_queries)) * 100
          : 0;

        return NextResponse.json({
          data: {
            hitRate: Math.round(hitRate * 100) / 100,
            totalQueries: parseInt(hitData?.total_queries || '0'),
            avgResponseTime: Math.round(parseFloat(avgTimeResult.rows[0]?.avg_time || '0')),
            cacheSize: parseInt(cacheSizeResult.rows[0]?.cache_size || '0'),
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

        await query(`
          INSERT INTO forecast_cache.summary_cache
          (cache_key, query_fingerprint, state, data, expires_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (cache_key)
          DO UPDATE SET
            data = EXCLUDED.data,
            updated_at = NOW(),
            expires_at = EXCLUDED.expires_at
        `, [cacheKey, fingerprint, filters.state, JSON.stringify(summaryData), expiresAt]);

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

        await query(`
          INSERT INTO forecast_cache.timeseries_cache
          (cache_key, query_fingerprint, state, start_date, end_date, data, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (cache_key)
          DO UPDATE SET
            data = EXCLUDED.data,
            updated_at = NOW(),
            expires_at = EXCLUDED.expires_at
        `, [
          tsCacheKey,
          tsFingerprint,
          tsFilters.state,
          startDate,
          endDate,
          JSON.stringify(timeseriesData),
          tsExpiresAt
        ]);

        return NextResponse.json({ success: true });

      case 'record_metrics':
        const { metrics } = data;

        await query(`
          INSERT INTO forecast_cache.query_metrics
          (query_fingerprint, query_type, execution_time_ms, data_source, cache_hit, error_occurred, user_id, filters)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          metrics.query_fingerprint,
          metrics.query_type,
          metrics.execution_time_ms,
          metrics.data_source,
          metrics.cache_hit,
          metrics.error_occurred,
          metrics.user_id,
          JSON.stringify(metrics.filters),
        ]);

        return NextResponse.json({ success: true });

      case 'increment_hit':
        const { tableName, cacheId } = data;

        await query(`
          UPDATE forecast_cache.${tableName}
          SET hit_count = hit_count + 1
          WHERE id = $1
        `, [cacheId]);

        return NextResponse.json({ success: true });

      case 'clear_expired':
        await db.transaction(async (client) => {
          await client.query('DELETE FROM forecast_cache.summary_cache WHERE expires_at <= NOW()');
          await client.query('DELETE FROM forecast_cache.timeseries_cache WHERE expires_at <= NOW()');
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
