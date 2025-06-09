import { NextRequest, NextResponse } from 'next/server';
import { sql, eq, inArray, and, gte, lte } from 'drizzle-orm';
import { db } from '@/app/db/drizzle';
import { forecastData, dashboardForecastView } from '@/app/db/schema/forecast-data';
import { forecastAdjustments } from '@/app/db/schema/adjustments';
import { toPostgresDate } from '@/app/lib/date-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, filters, query } = body;

    let result;
    switch (action) {
      case 'execute_query':
        if (!query) {
          return NextResponse.json({ error: 'Query required' }, { status: 400 });
        }
        result = await executeRawQuery(query);
        break;

      case 'get_forecast_data':
        console.log('API - get_forecast_data filters:', filters);
        result = await getForecastData(filters);
        break;

      case 'get_forecast_summary':
        result = await getForecastSummary(filters?.state);
        break;

      case 'get_forecast_by_date':
        result = await getForecastByDate(filters);
        break;

      case 'get_distinct_states':
        result = await getDistinctValues('state');
        break;

      case 'get_distinct_dma_ids':
        result = await getDistinctValues('dma_id');
        break;

      case 'get_distinct_dc_ids':
        result = await getDistinctValues('dc_id');
        break;

      case 'get_distinct_inventory_items':
        result = await getDistinctValues('inventory_item_id');
        break;

      case 'get_distinct_restaurants':
        result = await getDistinctValues('restaurant_id');
        break;

      case 'get_dashboard_forecast':
        result = await getDashboardForecast(filters);
        break;

      case 'refresh_materialized_view':
        result = await refreshMaterializedView();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // For execute_query, return the full response format
    if (action === 'execute_query') {
      return NextResponse.json(result);
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Postgres forecast API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

interface ForecastFilters {
  restaurantId?: number;
  inventoryItemId?: number;
  state?: string | string[];
  dmaId?: string | string[];
  dcId?: number | number[];
  startDate?: string;
  endDate?: string;
  limit?: number;
}

interface ForecastDataResponse {
  restaurant_id: number;
  inventory_item_id: string;
  business_date: string;
  dma_id: string;
  dc_id: string;
  state: string;
  y_05: number;
  y_50: number;
  y_95: number;
  // Adjustment fields
  adjusted_y_50?: number;
  original_y_50?: number;
  total_adjustment_percent?: number;
  adjustment_count?: number;
  hasAdjustment?: boolean;
}

async function getForecastData(filters: ForecastFilters | undefined): Promise<ForecastDataResponse[]> {
  const conditions = [];

  // Build WHERE conditions
  if (filters?.restaurantId) {
    conditions.push(eq(forecastData.restaurantId, filters.restaurantId));
  }

  if (filters?.inventoryItemId) {
    conditions.push(eq(forecastData.inventoryItemId, filters.inventoryItemId));
  }

  if (filters?.state) {
    if (Array.isArray(filters.state) && filters.state.length > 0) {
      conditions.push(inArray(forecastData.state, filters.state));
    } else if (!Array.isArray(filters.state)) {
      conditions.push(eq(forecastData.state, filters.state));
    }
  }

  if (filters?.dmaId) {
    if (Array.isArray(filters.dmaId) && filters.dmaId.length > 0) {
      conditions.push(inArray(forecastData.dmaId, filters.dmaId));
    } else if (!Array.isArray(filters.dmaId)) {
      conditions.push(eq(forecastData.dmaId, filters.dmaId));
    }
  }

  if (filters?.dcId) {
    if (Array.isArray(filters.dcId) && filters.dcId.length > 0) {
      conditions.push(inArray(forecastData.dcId, filters.dcId));
    } else if (!Array.isArray(filters.dcId)) {
      conditions.push(eq(forecastData.dcId, filters.dcId));
    }
  }

  if (filters?.startDate) {
    const startDate = toPostgresDate(filters.startDate);
    if (startDate) {
      conditions.push(gte(forecastData.businessDate, startDate));
    }
  }

  if (filters?.endDate) {
    const endDate = toPostgresDate(filters.endDate);
    if (endDate) {
      conditions.push(lte(forecastData.businessDate, endDate));
    }
  }

  // Query with LEFT JOIN to adjustments to calculate adjusted values
  const baseQuery = db
    .select({
      // Forecast data fields
      restaurantId: forecastData.restaurantId,
      inventoryItemId: forecastData.inventoryItemId,
      businessDate: forecastData.businessDate,
      dmaId: forecastData.dmaId,
      dcId: forecastData.dcId,
      state: forecastData.state,
      y05: forecastData.y05,
      y50: forecastData.y50,
      y95: forecastData.y95,
      // Aggregated adjustment fields
      totalAdjustmentPercent: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${forecastAdjustments.isActive} = true
              AND ${forecastData.businessDate} >= ${forecastAdjustments.adjustmentStartDate}
              AND ${forecastData.businessDate} <= ${forecastAdjustments.adjustmentEndDate}
              THEN ${forecastAdjustments.adjustmentValue}::numeric
              ELSE 0
            END
          ),
          0
        )
      `.as('total_adjustment_percent'),
      adjustmentCount: sql<number>`
        COUNT(
          CASE
            WHEN ${forecastAdjustments.isActive} = true
            AND ${forecastData.businessDate} >= ${forecastAdjustments.adjustmentStartDate}
            AND ${forecastData.businessDate} <= ${forecastAdjustments.adjustmentEndDate}
            THEN 1
            ELSE NULL
          END
        )
      `.as('adjustment_count'),
    })
    .from(forecastData)
    .leftJoin(
      forecastAdjustments,
      and(
        // Match on inventory item
        sql`${forecastAdjustments.filterContext}->>'inventoryItemId' = ${forecastData.inventoryItemId}::text`,
        // Match on states (if adjustment has states filter)
        sql`(
          ${forecastAdjustments.filterContext}->>'states' IS NULL
          OR ${forecastAdjustments.filterContext}->>'states' = '[]'
          OR ${forecastData.state} = ANY(
            ARRAY(
              SELECT jsonb_array_elements_text(${forecastAdjustments.filterContext}->'states')
            )
          )
        )`,
        // Match on DMAs (if adjustment has DMA filter)
        sql`(
          ${forecastAdjustments.filterContext}->>'dmaIds' IS NULL
          OR ${forecastAdjustments.filterContext}->>'dmaIds' = '[]'
          OR ${forecastData.dmaId} = ANY(
            ARRAY(
              SELECT jsonb_array_elements_text(${forecastAdjustments.filterContext}->'dmaIds')
            )
          )
        )`,
        // Match on DCs (if adjustment has DC filter)
        sql`(
          ${forecastAdjustments.filterContext}->>'dcIds' IS NULL
          OR ${forecastAdjustments.filterContext}->>'dcIds' = '[]'
          OR ${forecastData.dcId}::text = ANY(
            ARRAY(
              SELECT jsonb_array_elements_text(${forecastAdjustments.filterContext}->'dcIds')
            )
          )
        )`
      )
    )
    .groupBy(
      forecastData.restaurantId,
      forecastData.inventoryItemId,
      forecastData.businessDate,
      forecastData.dmaId,
      forecastData.dcId,
      forecastData.state,
      forecastData.y05,
      forecastData.y50,
      forecastData.y95
    );

  const filteredQuery = conditions.length > 0
    ? baseQuery.where(and(...conditions))
    : baseQuery;

  const result = await filteredQuery
    .orderBy(forecastData.businessDate);

  console.log(`API - Query returned ${result.length} rows with ${conditions.length} conditions`);
  if (conditions.length > 0) {
    console.log('API - Applied filters:', {
      inventoryItemId: filters?.inventoryItemId,
      states: filters?.state,
      dmaIds: filters?.dmaId,
      dcIds: filters?.dcId,
      dateRange: `${filters?.startDate} to ${filters?.endDate}`
    });
  }

  // Transform the result to snake_case format expected by frontend
  return result.map(row => {
    const y50Value = parseFloat(row.y50?.toString() || '0');
    const adjustmentPercent = parseFloat(row.totalAdjustmentPercent?.toString() || '0');
    const hasAdjustment = adjustmentPercent !== 0;
    const adjustedY50 = hasAdjustment ? y50Value * (1 + adjustmentPercent / 100) : y50Value;

    return {
      restaurant_id: row.restaurantId,
      inventory_item_id: row.inventoryItemId?.toString() || '',
      business_date: row.businessDate?.toString() || '',
      dma_id: row.dmaId || '',
      dc_id: row.dcId?.toString() || '',
      state: row.state || '',
      y_05: parseFloat(row.y05?.toString() || '0'),
      y_50: y50Value,
      y_95: parseFloat(row.y95?.toString() || '0'),
      // Adjustment fields
      adjusted_y_50: adjustedY50,
      original_y_50: hasAdjustment ? y50Value : undefined,
      total_adjustment_percent: hasAdjustment ? adjustmentPercent : undefined,
      adjustment_count: parseInt(row.adjustmentCount?.toString() || '0'),
      hasAdjustment
    };
  });
}

async function getForecastSummary(state: string | undefined) {
  const baseQuery = db
    .select({
      inventoryItemId: forecastData.inventoryItemId,
      totalCount: sql<number>`COUNT(*)`,
      avgY50: sql<number>`AVG(${forecastData.y50})`,
      minDate: sql<Date>`MIN(${forecastData.businessDate})`,
      maxDate: sql<Date>`MAX(${forecastData.businessDate})`,
    })
    .from(forecastData);

  if (state) {
    baseQuery.where(eq(forecastData.state, state));
  }

  const result = await baseQuery.groupBy(forecastData.inventoryItemId);
  return result;
}

async function getForecastByDate(filters: ForecastFilters) {
  const conditions = [];

  if (filters?.startDate) {
    const startDate = toPostgresDate(filters.startDate);
    if (startDate) {
      conditions.push(gte(forecastData.businessDate, startDate));
    }
  }

  if (filters?.endDate) {
    const endDate = toPostgresDate(filters.endDate);
    if (endDate) {
      conditions.push(lte(forecastData.businessDate, endDate));
    }
  }

  if (filters?.state) {
    conditions.push(eq(forecastData.state, filters.state as string));
  }

  const result = await db
    .select({
      businessDate: forecastData.businessDate,
      state: forecastData.state,
      totalY50: sql<number>`SUM(${forecastData.y50})`,
      avgY50: sql<number>`AVG(${forecastData.y50})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(forecastData)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(forecastData.businessDate, forecastData.state)
    .orderBy(forecastData.businessDate);

  return result;
}

async function getDistinctValues(column: string) {
  let query;

  switch (column) {
    case 'state':
      query = db
        .selectDistinct({ value: forecastData.state })
        .from(forecastData)
        .where(sql`${forecastData.state} IS NOT NULL`)
        .orderBy(forecastData.state);
      break;
    case 'dma_id':
      query = db
        .selectDistinct({ value: forecastData.dmaId })
        .from(forecastData)
        .where(sql`${forecastData.dmaId} IS NOT NULL`)
        .orderBy(forecastData.dmaId);
      break;
    case 'dc_id':
      query = db
        .selectDistinct({ value: forecastData.dcId })
        .from(forecastData)
        .where(sql`${forecastData.dcId} IS NOT NULL`)
        .orderBy(forecastData.dcId);
      break;
    case 'inventory_item_id':
      query = db
        .selectDistinct({ value: forecastData.inventoryItemId })
        .from(forecastData)
        .orderBy(forecastData.inventoryItemId);
      break;
    case 'restaurant_id':
      query = db
        .selectDistinct({ value: forecastData.restaurantId })
        .from(forecastData)
        .orderBy(forecastData.restaurantId);
      break;
    default:
      return [];
  }

  const result = await query;
  return result.map(r => r.value?.toString() || '');
}

async function getDashboardForecast(filters: ForecastFilters) {
  // Use materialized view if available
  const conditions = [];

  if (filters?.state) {
    conditions.push(eq(dashboardForecastView.state, filters.state as string));
  }

  if (filters?.startDate) {
    const startDate = toPostgresDate(filters.startDate);
    if (startDate) {
      conditions.push(gte(dashboardForecastView.businessDate, startDate));
    }
  }

  if (filters?.endDate) {
    const endDate = toPostgresDate(filters.endDate);
    if (endDate) {
      conditions.push(lte(dashboardForecastView.businessDate, endDate));
    }
  }

  const result = await db
    .select()
    .from(dashboardForecastView)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(filters?.limit || 1000);

  return result;
}

async function refreshMaterializedView() {
  await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_forecast_view`);
  return { success: true };
}

async function executeRawQuery(query: string) {
  // For security, validate that the query is a SELECT statement
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery.startsWith('select') && !normalizedQuery.startsWith('with')) {
    return {
      error: 'Only SELECT queries are allowed',
      fields: [],
      rows: []
    };
  }

  try {
    const result = await db.execute(sql.raw(query));

    return {
      fields: result.fields.map(f => ({
        name: f.name,
        dataTypeID: f.dataTypeID
      })),
      rows: result.rows
    };
  } catch (error) {
    console.error('Query execution error:', error);
    return {
      error: error instanceof Error ? error.message : 'Query execution failed',
      fields: [],
      rows: []
    };
  }
}
