# Demand Planning Dashboard Data Structures

This document outlines the TypeScript interfaces for the data structures used in the Demand Planning Dashboard.

## Hierarchical Data

```typescript
// Common hierarchy node interface
interface HierarchyNode {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  children?: HierarchyNode[];
  metadata?: Record<string, unknown>;
}

// Geography hierarchy
interface GeographyNode extends HierarchyNode {
  type: 'region' | 'country' | 'state' | 'dma';
  code?: string;
}

// Product hierarchy
interface ProductNode extends HierarchyNode {
  type: 'category' | 'subcategory' | 'product';
  sku?: string;
}

// Customer hierarchy
interface CustomerNode extends HierarchyNode {
  type: 'segment' | 'account' | 'customer';
  accountId?: string;
}

// Campaign hierarchy
interface CampaignNode extends HierarchyNode {
  type: 'campaign-type' | 'campaign' | 'initiative';
  startDate?: string;
  endDate?: string;
}

// Unified hierarchy type
type HierarchyType = 'geography' | 'product' | 'customer' | 'campaign';

// Hierarchy selection state
interface HierarchySelection {
  type: HierarchyType;
  selectedNodes: string[]; // Array of node IDs
}
```

## Forecast Data

```typescript
// Time period definition
interface TimePeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

// Base forecast data point
interface ForecastDataPoint {
  periodId: string;
  value: number;
  metadata?: Record<string, unknown>;
}

// Complete forecast series
interface ForecastSeries {
  id: string;
  hierarchySelections: HierarchySelection[];
  timePeriods: TimePeriod[];
  baseline: ForecastDataPoint[];
  adjusted?: ForecastDataPoint[];
  lastUpdated: string;
}
```

## Adjustment Data

```typescript
// Adjustment type
type AdjustmentType = 'percentage' | 'absolute';

// Adjustment reason category
type AdjustmentReason =
  | 'marketing-campaign'
  | 'product-performance'
  | 'economic-trends'
  | 'weather-impact'
  | 'supply-chain'
  | 'competitive-activity'
  | 'pricing-change'
  | 'other';

// Adjustment definition
interface Adjustment {
  id: string;
  hierarchySelections: HierarchySelection[];
  timePeriods: string[]; // Array of period IDs
  type: AdjustmentType;
  value: number;
  reason: AdjustmentReason;
  notes?: string;
  createdBy: string;
  createdAt: string;
  appliedToForecasts: string[]; // Array of forecast series IDs
}

// Adjustment history entry with impact data
interface AdjustmentHistoryEntry extends Adjustment {
  impact: {
    beforeTotal: number;
    afterTotal: number;
    absoluteChange: number;
    percentageChange: number;
  }
}
```

## UI State

```typescript
// Dashboard view
type DashboardView = 'forecast' | 'history' | 'settings';

// Forecast view state
interface ForecastViewState {
  selectedTimePeriods: string[];
  selectedHierarchies: HierarchySelection[];
  currentForecast: ForecastSeries | null;
  isAdjustmentModalOpen: boolean;
  currentAdjustment: Partial<Adjustment>;
}

// History view state
interface HistoryViewState {
  filters: {
    dateRange: { start: string, end: string } | null;
    hierarchySelections: HierarchySelection[];
    reasons: AdjustmentReason[];
    users: string[];
  };
  sortField: keyof AdjustmentHistoryEntry;
  sortDirection: 'asc' | 'desc';
  entries: AdjustmentHistoryEntry[];
}

// Main dashboard state
interface DashboardState {
  currentView: DashboardView;
  forecastView: ForecastViewState;
  historyView: HistoryViewState;
  availableHierarchies: Record<HierarchyType, HierarchyNode[]>;
}
```

## API Response Types

```typescript
// Fetch hierarchy response
interface GetHierarchyResponse {
  type: HierarchyType;
  nodes: HierarchyNode[];
}

// Fetch forecast response
interface GetForecastResponse {
  forecast: ForecastSeries;
}

// Apply adjustment response
interface ApplyAdjustmentResponse {
  adjustment: Adjustment;
  updatedForecast: ForecastSeries;
}

// Fetch adjustment history response
interface GetAdjustmentHistoryResponse {
  entries: AdjustmentHistoryEntry[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
}
```

## Example API Calls

### Fetching Hierarchies
```
GET /api/hierarchies?type=geography
```

### Fetching Forecast
```
POST /api/forecasts
Body: {
  hierarchySelections: [
    {
      type: "geography",
      selectedNodes: ["region-123", "country-456"]
    },
    {
      type: "product",
      selectedNodes: ["product-789"]
    }
  ],
  timePeriods: ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4"]
}
```

### Applying Adjustment
```
POST /api/adjustments
Body: {
  hierarchySelections: [
    {
      type: "geography",
      selectedNodes: ["region-123"]
    },
    {
      type: "product",
      selectedNodes: ["product-789"]
    }
  ],
  timePeriods: ["2025-Q2", "2025-Q3"],
  type: "percentage",
  value: 5,
  reason: "marketing-campaign",
  notes: "Summer promotion expected to increase demand"
}
```

### Fetching Adjustment History
```
GET /api/adjustments/history?fromDate=2025-01-01&toDate=2025-12-31&hierarchyType=geography&nodeId=region-123&page=1&pageSize=20
```
