/**
 * Types for UI state management in the demand planning dashboard
 */

import { HierarchyNode, HierarchySelection, HierarchyType } from './hierarchy';
import { AdjustmentHistoryEntry, AdjustmentReason, ForecastSeries, TimePeriod } from './forecast';

// Dashboard view
export type DashboardView = 'forecast' | 'history' | 'settings';

// Forecast view state
export interface ForecastViewState {
  selectedTimePeriods: string[];
  selectedHierarchies: HierarchySelection[];
  currentForecast: ForecastSeries | null;
  isAdjustmentModalOpen: boolean;
  currentAdjustment: Partial<AdjustmentHistoryEntry>;
}

// History view state
export interface HistoryViewState {
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
export interface DashboardState {
  currentView: DashboardView;
  forecastView: ForecastViewState;
  historyView: HistoryViewState;
  availableHierarchies: Record<HierarchyType, HierarchyNode[]>;
}

// Time period selection state
export interface TimePeriodState {
  availablePeriods: TimePeriod[];
  selectedPeriods: string[];
  granularity: TimePeriod['type'];
}
