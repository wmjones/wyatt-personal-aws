# Postgres Forecast API Documentation

## Overview

The postgres-forecast API provides access to forecast data stored in a PostgreSQL database. It supports various filtering options and data aggregation modes to serve different dashboard requirements.

## Base URL

- **Development**: `http://localhost:3000/api/data/postgres-forecast`
- **Production**: `https://your-domain.com/api/data/postgres-forecast`

## Endpoints

### POST /api/data/postgres-forecast

Handles multiple forecast data operations based on the `action` parameter.

#### Actions

##### `get_forecast_data`
Gets forecast data with optional filtering and aggregation.

**Request Body:**
```json
{
  "action": "get_forecast_data",
  "filters": {
    "inventoryItemId": 1,
    "state": ["CA", "TX"],
    "dmaId": ["DMA-1", "DMA-2"],
    "dcId": [101, 102],
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "limit": 10000
  }
}
```

**Response:**
```json
{
  "data": [
    {
      "inventory_item_id": 1,
      "business_date": "2025-01-01",
      "state": "CA,TX",
      "dma_id": "DMA-1,DMA-2",
      "dc_id": "101,102",
      "restaurant_id": 1,
      "y_05": 100.5,
      "y_50": 150.0,
      "y_95": 200.5
    }
  ]
}
```

**Filtering Behavior:**
- When `inventoryItemId` is specified, data is automatically aggregated by date
- All location filters (state, dmaId, dcId) are applied **before** aggregation
- Aggregated results show combined filter values (e.g., "CA,TX" for multiple states)

##### `get_distinct_inventory_items`
Returns all available inventory item IDs.

**Request Body:**
```json
{
  "action": "get_distinct_inventory_items"
}
```

**Response:**
```json
{
  "data": ["1", "2", "3", "4", "5"]
}
```

##### `get_distinct_states`
Returns all available state values.

##### `get_distinct_dma_ids`
Returns all available DMA IDs.

##### `get_distinct_dc_ids`
Returns all available distribution center IDs.

### GET /api/data/postgres-forecast

Provides convenient query parameter access for forecast data.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `itemIds` | string | Yes | Comma-separated inventory item IDs |
| `startDate` | string | Yes | Start date (YYYY-MM-DD) |
| `endDate` | string | Yes | End date (YYYY-MM-DD) |
| `states` | string | No | Comma-separated state codes |
| `dmaIds` | string | No | Comma-separated DMA IDs |
| `dcIds` | string | No | Comma-separated DC IDs |
| `type` | string | No | Response format: "summary", "timeseries", or default |

#### Examples

**Basic forecast data for first inventory item:**
```
GET /api/data/postgres-forecast?itemIds=1&startDate=2025-01-01&endDate=2025-03-31
```

**Summary view with state filter:**
```
GET /api/data/postgres-forecast?itemIds=1&startDate=2025-01-01&endDate=2025-03-31&states=CA,TX&type=summary
```

**Time series with all location filters:**
```
GET /api/data/postgres-forecast?itemIds=1&startDate=2025-01-01&endDate=2025-01-07&states=CA&dmaIds=DMA-1&dcIds=101&type=timeseries
```

## Data Model

### Forecast Data Structure

```typescript
interface ForecastData {
  inventory_item_id: number;
  business_date: string;
  state: string;
  dma_id: string;
  dc_id: string | number;
  restaurant_id: number;
  y_05: number;  // 5th percentile forecast
  y_50: number;  // 50th percentile forecast (median)
  y_95: number;  // 95th percentile forecast
}
```

### Filter Interface

```typescript
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
```

## Initial Data Loading

The API supports automatic initial data loading:

1. **Page Load Behavior**: When no `inventoryItemId` is specified, the frontend automatically:
   - Fetches the first available inventory item using `get_distinct_inventory_items`
   - Loads data for that item with default date range (Jan 1 - Mar 31)
   - Displays the forecast immediately without requiring user filter selection

2. **Default Date Range**: If no date range is specified, the system defaults to:
   - Start Date: `2025-01-01`
   - End Date: `2025-03-31`

## Filtering Logic

### Filter Application Order

1. **Database-level filtering**: All location filters are applied in the SQL WHERE clause
2. **Aggregation**: When `inventoryItemId` is specified, data is aggregated by date
3. **Post-processing**: Additional formatting and response transformation

### Aggregation Behavior

When `inventoryItemId` is specified:

- **Individual records** are summed across locations that match the filters
- **Location fields** show combined values (e.g., "CA,TX" for multiple states)
- **Placeholder values** are used for aggregated fields:
  - `state`: Shows actual filtered states or "ALL" if no state filter
  - `dma_id`: Shows actual filtered DMAs or "AGGREGATED" if no DMA filter
  - `dc_id`: Shows actual filtered DCs or "-1" if no DC filter
  - `restaurant_id`: Always "1" (placeholder for aggregated data)

## Error Handling

### Common Error Responses

**Missing Required Parameters:**
```json
{
  "error": "Missing required parameters: itemIds, startDate, endDate",
  "status": 400
}
```

**Database Connection Error:**
```json
{
  "error": "Internal server error",
  "details": "Connection timeout",
  "status": 500
}
```

**Invalid Action:**
```json
{
  "error": "Invalid action",
  "status": 400
}
```

## Performance Considerations

1. **Aggregation**: Pre-aggregated queries perform better than post-processing aggregation
2. **Date Ranges**: Smaller date ranges improve query performance
3. **Filtering**: More specific filters reduce data transfer and processing time
4. **Limits**: Use the `limit` parameter to control result set size (default: 10,000)

## Frontend Integration

### React Hook Usage

```typescript
import { useForecastData } from './hooks/useForecastQuery';

function ForecastComponent() {
  const { data, isLoading, error } = useForecastData({
    itemIds: ['1'],
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    states: ['CA', 'TX'],
    dmaIds: ['DMA-1'],
    dcIds: [101, 102]
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <ForecastChart data={data} />;
}
```

### Service Layer Usage

```typescript
import { postgresForecastService } from '@/services/postgresForecastService';

// Get forecast data with filters
const data = await postgresForecastService.getForecastData({
  inventoryItemId: 1,
  state: ['CA', 'TX'],
  startDate: '2025-01-01',
  endDate: '2025-03-31'
});

// Get available options for dropdowns
const inventoryItems = await postgresForecastService.getDistinctInventoryItems();
const states = await postgresForecastService.getDistinctStates();
```

## Migration Notes

### Task 43 Changes

1. **Initial Loading**: Added automatic selection of first inventory item on page load
2. **Filter Order**: Ensured all location filters are applied before aggregation
3. **Parameter Cleanup**: Removed unused `locationIds` parameter
4. **Aggregation Logic**: Improved handling of pre-aggregated vs. manual aggregation paths

### Breaking Changes

- None - all changes are backward compatible
- Existing API calls will continue to work as before
- New automatic loading behavior only affects empty filter states

## Testing

### Manual Testing

Use the test script to verify functionality:

```bash
npx tsx scripts/test-forecast-api-comprehensive.ts
```

### API Testing

```bash
# Test distinct values
curl -X POST http://localhost:3000/api/data/postgres-forecast \
  -H "Content-Type: application/json" \
  -d '{"action":"get_distinct_inventory_items"}'

# Test filtered forecast data
curl "http://localhost:3000/api/data/postgres-forecast?itemIds=1&startDate=2025-01-01&endDate=2025-01-31&states=CA&type=summary"
```
