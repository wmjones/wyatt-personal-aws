import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { toPostgresDate } from '@/app/lib/date-utils';

// Initialize connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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
  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let paramCount = 0;

  // Build WHERE conditions
  if (filters?.restaurantId) {
    conditions.push(`fd.restaurant_id = $${++paramCount}`);
    values.push(filters.restaurantId);
  }

  if (filters?.inventoryItemId) {
    conditions.push(`fd.inventory_item_id = $${++paramCount}`);
    values.push(filters.inventoryItemId);
  }

  if (filters?.state) {
    if (Array.isArray(filters.state)) {
      const placeholders = filters.state.map(() => `$${++paramCount}`).join(',');
      conditions.push(`fd.state IN (${placeholders})`);
      values.push(...filters.state);
    } else {
      conditions.push(`fd.state = $${++paramCount}`);
      values.push(filters.state);
    }
  }

  if (filters?.dmaId) {
    if (Array.isArray(filters.dmaId)) {
      const placeholders = filters.dmaId.map(() => `$${++paramCount}`).join(',');
      conditions.push(`fd.dma_id IN (${placeholders})`);
      values.push(...filters.dmaId);
    } else {
      conditions.push(`fd.dma_id = $${++paramCount}`);
      values.push(filters.dmaId);
    }
  }

  if (filters?.dcId) {
    if (Array.isArray(filters.dcId)) {
      const placeholders = filters.dcId.map(() => `$${++paramCount}`).join(',');
      conditions.push(`fd.dc_id IN (${placeholders})`);
      values.push(...filters.dcId);
    } else {
      conditions.push(`fd.dc_id = $${++paramCount}`);
      values.push(filters.dcId);
    }
  }

  if (filters?.startDate) {
    const startDate = toPostgresDate(filters.startDate);
    if (startDate) {
      conditions.push(`fd.business_date >= $${++paramCount}`);
      values.push(startDate);
    }
  }

  if (filters?.endDate) {
    const endDate = toPostgresDate(filters.endDate);
    if (endDate) {
      conditions.push(`fd.business_date <= $${++paramCount}`);
      values.push(endDate);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit || 10000;

  // When filtering by specific inventory item, aggregate by date
  const aggregateByDate = filters?.inventoryItemId != null;

  // Build adjustment subquery with parameterized queries to prevent SQL injection
  const adjustmentConditions: string[] = ['fa.is_active = true'];
  const adjustmentValues: (string | number)[] = [];
  let adjustmentParamCount = paramCount;

  // Match inventory item if specified
  if (filters?.inventoryItemId) {
    adjustmentConditions.push(`(fa.filter_context->>'inventoryItemId' IS NULL OR fa.filter_context->>'inventoryItemId' = $${++adjustmentParamCount})`);
    adjustmentValues.push(filters.inventoryItemId);
  }

  // Match states
  const stateConditions = [
    'fa.filter_context->\'states\' IS NULL',
    'fa.filter_context->\'states\' = \'[]\'::jsonb'
  ];

  if (filters?.state) {
    if (Array.isArray(filters.state)) {
      for (const state of filters.state) {
        stateConditions.push(`fa.filter_context->'states' @> $${++adjustmentParamCount}::jsonb`);
        adjustmentValues.push(JSON.stringify([state]));
      }
    } else {
      stateConditions.push(`fa.filter_context->'states' @> $${++adjustmentParamCount}::jsonb`);
      adjustmentValues.push(JSON.stringify([filters.state]));
    }
  }
  adjustmentConditions.push(`(${stateConditions.join(' OR ')})`);

  // Match DMAs
  const dmaConditions = [
    'fa.filter_context->\'dmaIds\' IS NULL',
    'fa.filter_context->\'dmaIds\' = \'[]\'::jsonb'
  ];

  if (filters?.dmaId) {
    if (Array.isArray(filters.dmaId)) {
      for (const dmaId of filters.dmaId) {
        dmaConditions.push(`fa.filter_context->'dmaIds' @> $${++adjustmentParamCount}::jsonb`);
        adjustmentValues.push(JSON.stringify([dmaId]));
      }
    } else {
      dmaConditions.push(`fa.filter_context->'dmaIds' @> $${++adjustmentParamCount}::jsonb`);
      adjustmentValues.push(JSON.stringify([filters.dmaId]));
    }
  }
  adjustmentConditions.push(`(${dmaConditions.join(' OR ')})`);

  // Match DCs
  const dcConditions = [
    'fa.filter_context->\'dcIds\' IS NULL',
    'fa.filter_context->\'dcIds\' = \'[]\'::jsonb'
  ];

  if (filters?.dcId) {
    if (Array.isArray(filters.dcId)) {
      for (const dcId of filters.dcId) {
        dcConditions.push(`fa.filter_context->'dcIds' @> $${++adjustmentParamCount}::jsonb`);
        adjustmentValues.push(JSON.stringify([dcId]));
      }
    } else {
      dcConditions.push(`fa.filter_context->'dcIds' @> $${++adjustmentParamCount}::jsonb`);
      adjustmentValues.push(JSON.stringify([filters.dcId]));
    }
  }
  adjustmentConditions.push(`(${dcConditions.join(' OR ')})`);

  // Time window filtering (no parameters needed for this condition)
  adjustmentConditions.push(`(
    fa.adjustment_start_date IS NULL
    OR (
      fa.adjustment_start_date <= fd.business_date
      AND fa.adjustment_end_date >= fd.business_date
    )
  )`);

  const adjustmentSubquery = `
    SELECT
      fa.adjustment_value,
      fa.filter_context,
      fa.inventory_item_name,
      fa.adjustment_start_date,
      fa.adjustment_end_date
    FROM forecast_adjustments fa
    WHERE ${adjustmentConditions.join(' AND ')}
    ORDER BY fa.created_at DESC
  `;

  // Merge adjustment parameters with main query parameters
  const allValues = [...values, ...adjustmentValues];

  const query = aggregateByDate ? `
    WITH adjustments AS (${adjustmentSubquery})
    SELECT
      fd.inventory_item_id,
      fd.business_date::text as business_date,
      ${filters?.dmaId ? 'STRING_AGG(DISTINCT fd.dma_id::text, \',\' ORDER BY fd.dma_id::text)' : '\'AGGREGATED\''} as dma_id,
      ${filters?.dcId ? 'STRING_AGG(DISTINCT fd.dc_id::text, \',\' ORDER BY fd.dc_id::text)' : '\'-1\''} as dc_id,
      ${filters?.state ? 'STRING_AGG(DISTINCT fd.state, \',\' ORDER BY fd.state)' : '\'ALL\''} as state,
      1 as restaurant_id,
      SUM(fd.y_05) as y_05,
      SUM(fd.y_50) as y_50,
      SUM(fd.y_95) as y_95,
      -- Original values
      SUM(fd.y_05) as original_y_05,
      SUM(fd.y_50) as original_y_50,
      SUM(fd.y_95) as original_y_95,
      -- Apply adjustments
      COALESCE(
        SUM(fd.y_50) * (1 + COALESCE((SELECT SUM(adjustment_value) / 100 FROM adjustments), 0)),
        SUM(fd.y_50)
      ) as adjusted_y_50,
      COALESCE((SELECT SUM(adjustment_value) FROM adjustments), 0) as total_adjustment_percent,
      COALESCE((SELECT COUNT(*) FROM adjustments), 0) as adjustment_count
    FROM forecast_data fd
    ${whereClause}
    GROUP BY fd.inventory_item_id, fd.business_date
    ORDER BY fd.business_date DESC
    LIMIT ${limit}
  ` : `
    WITH adjustments AS (${adjustmentSubquery})
    SELECT
      fd.restaurant_id,
      fd.inventory_item_id,
      fd.business_date::text as business_date,
      fd.dma_id,
      fd.dc_id,
      fd.state,
      fd.y_05,
      fd.y_50,
      fd.y_95,
      -- Original values
      fd.y_05 as original_y_05,
      fd.y_50 as original_y_50,
      fd.y_95 as original_y_95,
      -- Apply adjustments
      COALESCE(
        fd.y_50 * (1 + COALESCE((SELECT SUM(adjustment_value) / 100 FROM adjustments), 0)),
        fd.y_50
      ) as adjusted_y_50,
      COALESCE((SELECT SUM(adjustment_value) FROM adjustments), 0) as total_adjustment_percent,
      COALESCE((SELECT COUNT(*) FROM adjustments), 0) as adjustment_count
    FROM forecast_data fd
    ${whereClause}
    ORDER BY fd.business_date DESC, fd.state, fd.restaurant_id
    LIMIT ${limit}
  `;

  const result = await pool.query(query, allValues);

  // Debug logging for aggregated queries
  if (aggregateByDate) {
    console.log('Aggregated forecast query with adjustments:', {
      inventoryItemId: filters?.inventoryItemId,
      appliedFilters: {
        state: filters?.state,
        dmaId: filters?.dmaId,
        dcId: filters?.dcId
      },
      rowCount: result.rows.length,
      sampleRows: result.rows.slice(0, 3).map(row => ({
        date: row.business_date,
        y_50: row.y_50,
        original_y_50: row.original_y_50,
        adjusted_y_50: row.adjusted_y_50,
        adjustment_percent: row.total_adjustment_percent,
        state: row.state,
        dma_id: row.dma_id,
        dc_id: row.dc_id
      }))
    });
  }

  return result.rows;
}

async function getForecastSummary(state?: string) {
  const conditions: string[] = [];
  const values: string[] = [];
  let paramCount = 0;

  if (state) {
    conditions.push(`state = $${++paramCount}`);
    values.push(state);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Use materialized view for better performance
  const query = `
    SELECT
      state,
      COUNT(*) as record_count,
      AVG(avg_forecast) as avg_forecast,
      MIN(min_forecast) as min_forecast,
      MAX(max_forecast) as max_forecast
    FROM forecast_summary
    ${whereClause}
    GROUP BY state
    ORDER BY state
  `;

  const result = await pool.query(query, values);
  return result.rows.map(row => ({
    state: row.state,
    recordCount: parseInt(row.record_count),
    avgForecast: parseFloat(row.avg_forecast),
    minForecast: parseFloat(row.min_forecast),
    maxForecast: parseFloat(row.max_forecast)
  }));
}

async function getForecastByDate(filters: {
  start_date?: string;
  end_date?: string;
  startDate?: string;  // Support both camelCase and snake_case
  endDate?: string;    // Support both camelCase and snake_case
  state?: string;
}) {
  const conditions: string[] = [];
  const values: string[] = [];
  let paramCount = 0;

  // Support both camelCase and snake_case
  const startDateValue = filters?.start_date || filters?.startDate;
  const endDateValue = filters?.end_date || filters?.endDate;

  if (startDateValue) {
    const startDate = toPostgresDate(startDateValue);
    if (startDate) {
      conditions.push(`business_date >= $${++paramCount}`);
      values.push(startDate);
    }
  }

  if (endDateValue) {
    const endDate = toPostgresDate(endDateValue);
    if (endDate) {
      conditions.push(`business_date <= $${++paramCount}`);
      values.push(endDate);
    }
  }

  if (filters?.state) {
    conditions.push(`state = $${++paramCount}`);
    values.push(filters.state);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Use materialized view for better performance
  const query = `
    SELECT
      business_date::text as business_date,
      ${filters?.state ? 'avg_forecast' : 'AVG(avg_forecast) as avg_forecast'}
    FROM forecast_summary
    ${whereClause}
    ${!filters?.state ? 'GROUP BY business_date' : ''}
    ORDER BY business_date
  `;

  const result = await pool.query(query, values);
  return result.rows.map(row => ({
    businessDate: row.business_date,
    avgForecast: parseFloat(row.avg_forecast)
  }));
}

async function getDistinctValues(column: string) {
  // Validate column name to prevent SQL injection
  const validColumns = ['state', 'dma_id', 'dc_id', 'inventory_item_id', 'restaurant_id'];
  if (!validColumns.includes(column)) {
    throw new Error('Invalid column name');
  }

  const query = `
    SELECT DISTINCT ${column}
    FROM forecast_data
    WHERE ${column} IS NOT NULL
    ORDER BY ${column}
  `;

  const result = await pool.query(query);
  return result.rows.map(row => {
    const value = row[column];
    return value != null ? String(value) : '';
  }).filter(value => value !== '');
}

interface DashboardFilters {
  states?: string[];
  dmaIds?: string[];
  dcIds?: number[];
  startDate?: string;
  endDate?: string;
}

async function getDashboardForecast(filters: DashboardFilters) {
  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let paramCount = 0;

  // Required: states filter
  if (!filters?.states || filters.states.length === 0) {
    throw new Error('States filter is required');
  }

  const statePlaceholders = filters.states.map(() => `$${++paramCount}`).join(',');
  conditions.push(`state IN (${statePlaceholders})`);
  values.push(...filters.states);

  // Optional filters
  if (filters?.dmaIds && filters.dmaIds.length > 0) {
    const dmaPlaceholders = filters.dmaIds.map(() => `$${++paramCount}`).join(',');
    conditions.push(`dma_id IN (${dmaPlaceholders})`);
    values.push(...filters.dmaIds);
  }

  if (filters?.dcIds && filters.dcIds.length > 0) {
    const dcPlaceholders = filters.dcIds.map(() => `$${++paramCount}`).join(',');
    conditions.push(`dc_id IN (${dcPlaceholders})`);
    values.push(...filters.dcIds);
  }

  if (filters?.startDate) {
    const startDate = toPostgresDate(filters.startDate);
    if (startDate) {
      conditions.push(`business_date >= $${++paramCount}`);
      values.push(startDate);
    }
  }

  if (filters?.endDate) {
    const endDate = toPostgresDate(filters.endDate);
    if (endDate) {
      conditions.push(`business_date <= $${++paramCount}`);
      values.push(endDate);
    }
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Main query with aggregation
  const dataQuery = `
    SELECT
      business_date::text as business_date,
      state,
      dma_id,
      dc_id,
      SUM(y_50) as total_forecast,
      AVG(y_50) as avg_forecast,
      COUNT(*) as location_count
    FROM forecast_data
    ${whereClause}
    GROUP BY business_date, state, dma_id, dc_id
    ORDER BY business_date, state
  `;

  // Summary query
  const summaryQuery = `
    SELECT
      COUNT(*) as total_records,
      AVG(y_50) as avg_forecast,
      MIN(business_date)::text as min_date,
      MAX(business_date)::text as max_date
    FROM forecast_data
    ${whereClause}
  `;

  const [dataResult, summaryResult] = await Promise.all([
    pool.query(dataQuery, values),
    pool.query(summaryQuery, values)
  ]);

  return {
    data: dataResult.rows,
    summary: {
      totalRecords: parseInt(summaryResult.rows[0].total_records),
      avgForecast: parseFloat(summaryResult.rows[0].avg_forecast),
      dateRange: {
        min: summaryResult.rows[0].min_date,
        max: summaryResult.rows[0].max_date
      }
    }
  };
}

async function refreshMaterializedView() {
  try {
    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY forecast_summary');
    return {
      success: true,
      message: 'Materialized view refreshed successfully'
    };
  } catch (error) {
    console.error('Error refreshing materialized view:', error);
    throw error;
  }
}

async function executeRawQuery(query: string) {
  try {
    // Only allow SELECT queries for safety
    const cleanQuery = query.trim();
    if (!cleanQuery.toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT queries are allowed');
    }

    const result = await pool.query(cleanQuery);

    // Format response to match expected structure
    return {
      message: 'Query executed successfully',
      data: {
        columns: result.fields.map(field => field.name),
        rows: result.rows.map(row => {
          return result.fields.map(field => {
            const value = row[field.name];
            return value !== null ? String(value) : '';
          });
        })
      }
    };
  } catch (error) {
    console.error('Error executing raw query:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    // Parse query parameters
    const itemIds = searchParams.get('itemIds')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Parse location filters
    const states = searchParams.get('states')?.split(',').filter(Boolean) || [];
    const dmaIds = searchParams.get('dmaIds')?.split(',').filter(Boolean) || [];
    const dcIds = searchParams.get('dcIds')?.split(',').filter(Boolean).map(id => parseInt(id)) || [];

    if (!itemIds.length || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: itemIds, startDate, endDate' },
        { status: 400 }
      );
    }

    // Convert to filters format expected by getForecastData
    const filters: ForecastFilters = {
      inventoryItemId: parseInt(itemIds[0]), // Using first item ID for now
      startDate,
      endDate,
      limit: 10000,
      // Add location filters if provided
      ...(states.length > 0 && { state: states }),
      ...(dmaIds.length > 0 && { dmaId: dmaIds }),
      ...(dcIds.length > 0 && { dcId: dcIds })
    };

    if (type === 'summary') {
      // For summary, get the already aggregated data from getForecastData
      // When inventoryItemId is specified, getForecastData already does the aggregation
      const data = await getForecastData(filters);

      // If data is already aggregated (when inventoryItemId is specified), return it directly
      if (data.length > 0 && (data[0].state === 'ALL' || data[0].dma_id === 'AGGREGATED')) {
        console.log('Using pre-aggregated data from getForecastData for summary view');
        // Data is already aggregated, just transform to expected format
        const summaryData = data.map(row => ({
          business_date: row.business_date,
          inventory_item_id: row.inventory_item_id || itemIds[0],
          restaurant_id: row.restaurant_id || '1',
          state: row.state,
          dma_id: row.dma_id,
          dc_id: row.dc_id,
          y_05: parseFloat(row.y_05) || 0,
          y_50: parseFloat(row.y_50) || 0,
          y_95: parseFloat(row.y_95) || 0,
          avgForecast: parseFloat(row.y_50) || 0,
          totalForecast: parseFloat(row.y_50) || 0
        }));
        return NextResponse.json(summaryData);
      }

      // Otherwise, do manual aggregation by date for summary view
      console.log('Performing manual aggregation for summary view');
      const summaryMap = new Map<string, { y_05: number; y_50: number; y_95: number; count: number }>();

      data.forEach(row => {
        const date = row.business_date;
        if (!summaryMap.has(date)) {
          summaryMap.set(date, { y_05: 0, y_50: 0, y_95: 0, count: 0 });
        }
        const summary = summaryMap.get(date)!;
        summary.y_05 += parseFloat(row.y_05) || 0;
        summary.y_50 += parseFloat(row.y_50) || 0;
        summary.y_95 += parseFloat(row.y_95) || 0;
        summary.count += 1;
      });

      const summaryData = Array.from(summaryMap.entries()).map(([date, values]) => ({
        business_date: date,
        inventory_item_id: itemIds[0],
        restaurant_id: '1', // Placeholder value - data is aggregated across all locations
        state: 'ALL',
        dma_id: 'AGGREGATED',
        dc_id: '-1',
        y_05: values.y_05,
        y_50: values.y_50,
        y_95: values.y_95,
        avgForecast: values.y_50 / values.count,
        totalForecast: values.y_50
      }));

      return NextResponse.json(summaryData);
    } else if (type === 'timeseries') {
      // For time series, return the raw data grouped by date
      const data = await getForecastData(filters);

      const timeSeriesData = data.map(row => ({
        business_date: row.business_date,
        inventory_item_id: row.inventory_item_id,
        restaurant_id: row.restaurant_id,
        state: row.state,
        dma_id: row.dma_id,
        dc_id: row.dc_id,
        y_05: parseFloat(row.y_05) || 0,
        y_50: parseFloat(row.y_50) || 0,
        y_95: parseFloat(row.y_95) || 0
      }));

      return NextResponse.json(timeSeriesData);
    } else {
      // Default: return raw forecast data
      const data = await getForecastData(filters);
      return NextResponse.json({ data });
    }
  } catch (error) {
    console.error('Postgres forecast GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
