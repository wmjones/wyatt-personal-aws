/**
 * Utility functions for adjustment calculations and formatting
 */

import { FilterSelections } from '../components/FilterSidebar';

export const formatFilterContext = (filterContext: FilterSelections, inventoryItemName?: string) => {
  const parts = [];

  if (inventoryItemName) {
    parts.push(inventoryItemName);
  }

  if (filterContext.states && filterContext.states.length > 0) {
    parts.push(`${filterContext.states.length} state${filterContext.states.length > 1 ? 's' : ''}`);
  }

  if (filterContext.dmaIds && filterContext.dmaIds.length > 0) {
    parts.push(`${filterContext.dmaIds.length} DMA${filterContext.dmaIds.length > 1 ? 's' : ''}`);
  }

  if (filterContext.dcIds && filterContext.dcIds.length > 0) {
    parts.push(`${filterContext.dcIds.length} DC${filterContext.dcIds.length > 1 ? 's' : ''}`);
  }

  return parts.join(' • ');
};

export const applyAdjustmentToForecast = (forecastValue: number, adjustmentPercentage: number): number => {
  return forecastValue * (1 + adjustmentPercentage / 100);
};

export const calculateAdjustmentImpact = (baselineTotal: number, adjustmentPercentage: number) => {
  const adjustedTotal = applyAdjustmentToForecast(baselineTotal, adjustmentPercentage);
  const absoluteChange = adjustedTotal - baselineTotal;
  const percentageChange = baselineTotal > 0 ? ((adjustedTotal / baselineTotal) - 1) * 100 : 0;

  return {
    beforeTotal: baselineTotal,
    afterTotal: adjustedTotal,
    absoluteChange,
    percentageChange
  };
};
