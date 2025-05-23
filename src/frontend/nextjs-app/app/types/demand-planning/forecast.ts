/**
 * Types for forecast data in the demand planning dashboard
 */

import { HierarchySelection } from './hierarchy';

// Time period definition
export interface TimePeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

// Base forecast data point
export interface ForecastDataPoint {
  periodId: string;
  value: number;
  inventoryItemId?: string;
  state?: string;
  dmaId?: string;
  dcId?: string;
  metadata?: Record<string, unknown>;
}

// Inventory item information
export interface InventoryItem {
  id: string;
  name?: string;
}

// Complete forecast series
export interface ForecastSeries {
  id: string;
  hierarchySelections: HierarchySelection[];
  timePeriods: TimePeriod[];
  baseline: ForecastDataPoint[];
  adjusted?: ForecastDataPoint[];
  inventoryItems: InventoryItem[];
  lastUpdated: string;
}

// Adjustment type
export type AdjustmentType = 'percentage' | 'absolute';

// Adjustment reason category
export type AdjustmentReason =
  | 'marketing-campaign'
  | 'product-performance'
  | 'economic-trends'
  | 'weather-impact'
  | 'supply-chain'
  | 'competitive-activity'
  | 'pricing-change'
  | 'other';

// Adjustment definition
export interface Adjustment {
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
export interface AdjustmentHistoryEntry extends Adjustment {
  impact: {
    beforeTotal: number;
    afterTotal: number;
    absoluteChange: number;
    percentageChange: number;
  }
}
