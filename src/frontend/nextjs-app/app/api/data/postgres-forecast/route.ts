import { NextRequest, NextResponse } from 'next/server';
import { sql, eq, inArray, and, gte, lte, or, desc } from 'drizzle-orm';
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

async function getForecastData(filters: ForecastFilters | undefined) {
  const conditions = [];

  // Build WHERE conditions
  if (filters?.restaurantId) {
    conditions.push(eq(forecastData.restaurantId, filters.restaurantId));
  }

  if (filters?.inventoryItemId) {
    conditions.push(eq(forecastData.inventoryItemId, filters.inventoryItemId));
  }

  if (filters?.state) {
    if (Array.isArray(filters.state)) {
      conditions.push(inArray(forecastData.state, filters.state));
    } else {
      conditions.push(eq(forecastData.state, filters.state));
    }
  }

  if (filters?.dmaId) {
    if (Array.isArray(filters.dmaId)) {
      conditions.push(inArray(forecastData.dmaId, filters.dmaId));
    } else {
      conditions.push(eq(forecastData.dmaId, filters.dmaId));
    }
  }

  if (filters?.dcId) {
    if (Array.isArray(filters.dcId)) {
      conditions.push(inArray(forecastData.dcId, filters.dcId));
    } else {
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

  const limit = filters?.limit || 10000;

  // Build adjustment conditions
  const adjustmentConditions = [eq(forecastAdjustments.isActive, true)];

  // Match inventory item if specified
  if (filters?.inventoryItemId) {
    const inventoryCondition = or(
      sql`${forecastAdjustments.filterContext}->>'inventoryItemId' IS NULL`,
      sql`${forecastAdjustments.filterContext}->>'inventoryItemId' = ${filters.inventoryItemId}`
    );
    if (inventoryCondition) {
      adjustmentConditions.push(inventoryCondition);
    }
  }

  // Complex adjustment query logic would need to be implemented here
  // For now, returning a simplified version
  const baseQuery = db
    .select()
    .from(forecastData);

  const filteredQuery = conditions.length > 0
    ? baseQuery.where(and(...conditions))
    : baseQuery;

  const result = await filteredQuery
    .orderBy(desc(forecastData.businessDate))
    .limit(limit);

  // Transform the result to snake_case format expected by frontend
  return result.map(row => ({
    restaurant_id: row.restaurantId,
    inventory_item_id: row.inventoryItemId?.toString() || '',
    business_date: row.businessDate?.toString() || '',
    dma_id: row.dmaId || '',
    dc_id: row.dcId?.toString() || '',
    state: row.state || '',
    y_05: parseFloat(row.y05?.toString() || '0'),
    y_50: parseFloat(row.y50?.toString() || '0'),
    y_95: parseFloat(row.y95?.toString() || '0')
  }));
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
    .orderBy(desc(forecastData.businessDate));

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
