/**
 * Types for API responses and requests for the demand planning dashboard
 */

import { HierarchyNode, HierarchyType } from './hierarchy';
import { Adjustment, AdjustmentHistoryEntry, ForecastSeries } from './forecast';

// Fetch hierarchy response
export interface GetHierarchyResponse {
  type: HierarchyType;
  nodes: HierarchyNode[];
}

// Fetch forecast request
export interface GetForecastRequest {
  hierarchySelections: {
    type: HierarchyType;
    selectedNodes: string[];
  }[];
  timePeriods: string[];
}

// Fetch forecast response
export interface GetForecastResponse {
  forecast: ForecastSeries;
}

// Apply adjustment request
export type ApplyAdjustmentRequest = Omit<Adjustment, 'id' | 'createdBy' | 'createdAt'>

// Apply adjustment response
export interface ApplyAdjustmentResponse {
  adjustment: Adjustment;
  updatedForecast: ForecastSeries;
}

// Fetch adjustment history request
export interface GetAdjustmentHistoryRequest {
  fromDate?: string;
  toDate?: string;
  hierarchyType?: HierarchyType;
  nodeId?: string;
  reason?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}

// Fetch adjustment history response
export interface GetAdjustmentHistoryResponse {
  entries: AdjustmentHistoryEntry[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
}
