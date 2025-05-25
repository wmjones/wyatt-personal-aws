import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

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
    const { action, filters } = body;

    let result;
    switch (action) {
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
    conditions.push(`restaurant_id = $${++paramCount}`);
    values.push(filters.restaurantId);
  }

  if (filters?.inventoryItemId) {
    conditions.push(`inventory_item_id = $${++paramCount}`);
    values.push(filters.inventoryItemId);
  }

  if (filters?.state) {
    if (Array.isArray(filters.state)) {
      const placeholders = filters.state.map(() => `$${++paramCount}`).join(',');
      conditions.push(`state IN (${placeholders})`);
      values.push(...filters.state);
    } else {
      conditions.push(`state = $${++paramCount}`);
      values.push(filters.state);
    }
  }

  if (filters?.dmaId) {
    if (Array.isArray(filters.dmaId)) {
      const placeholders = filters.dmaId.map(() => `$${++paramCount}`).join(',');
      conditions.push(`dma_id IN (${placeholders})`);
      values.push(...filters.dmaId);
    } else {
      conditions.push(`dma_id = $${++paramCount}`);
      values.push(filters.dmaId);
    }
  }

  if (filters?.dcId) {
    if (Array.isArray(filters.dcId)) {
      const placeholders = filters.dcId.map(() => `$${++paramCount}`).join(',');
      conditions.push(`dc_id IN (${placeholders})`);
      values.push(...filters.dcId);
    } else {
      conditions.push(`dc_id = $${++paramCount}`);
      values.push(filters.dcId);
    }
  }

  if (filters?.startDate) {
    conditions.push(`business_date >= $${++paramCount}`);
    values.push(filters.startDate);
  }

  if (filters?.endDate) {
    conditions.push(`business_date <= $${++paramCount}`);
    values.push(filters.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = filters?.limit ? `LIMIT ${filters.limit}` : '';

  const query = `
    SELECT
      restaurant_id,
      inventory_item_id,
      business_date::text as business_date,
      dma_id,
      dc_id,
      state,
      y_05,
      y_50,
      y_95
    FROM forecast_data
    ${whereClause}
    ORDER BY business_date DESC, restaurant_id, inventory_item_id
    ${limitClause}
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

async function getForecastSummary(state?: string) {
  let query: string;
  let values: string[] = [];

  if (state) {
    // Use materialized view for single state query
    query = `
      SELECT
        state,
        SUM(record_count) as record_count,
        AVG(avg_forecast) as avg_forecast,
        MIN(min_forecast_05) as min_forecast,
        MAX(max_forecast_95) as max_forecast
      FROM forecast_summary
      WHERE state = $1
      GROUP BY state
    `;
    values = [state];
  } else {
    // Use materialized view for all states
    query = `
      SELECT
        state,
        SUM(record_count) as record_count,
        AVG(avg_forecast) as avg_forecast,
        MIN(min_forecast_05) as min_forecast,
        MAX(max_forecast_95) as max_forecast
      FROM forecast_summary
      GROUP BY state
      ORDER BY state
    `;
  }

  const result = await pool.query(query, values);
  return result.rows.map(row => ({
    state: row.state,
    recordCount: parseInt(row.record_count),
    avgForecast: parseFloat(row.avg_forecast),
    minForecast: parseFloat(row.min_forecast),
    maxForecast: parseFloat(row.max_forecast)
  }));
}

interface DateFilters {
  startDate?: string;
  endDate?: string;
  state?: string;
}

async function getForecastByDate(filters: DateFilters | undefined) {
  const conditions: string[] = [];
  const values: string[] = [];
  let paramCount = 0;

  if (filters?.startDate) {
    conditions.push(`business_date >= $${++paramCount}`);
    values.push(filters.startDate);
  }

  if (filters?.endDate) {
    conditions.push(`business_date <= $${++paramCount}`);
    values.push(filters.endDate);
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
  return result.rows.map(row => row[column].toString());
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
    conditions.push(`business_date >= $${++paramCount}`);
    values.push(filters.startDate);
  }

  if (filters?.endDate) {
    conditions.push(`business_date <= $${++paramCount}`);
    values.push(filters.endDate);
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
