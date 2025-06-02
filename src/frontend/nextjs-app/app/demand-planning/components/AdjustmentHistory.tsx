'use client';

import { FilterSelections } from './FilterSidebar';
import { formatFilterContext } from '../lib/adjustment-utils';

interface AdjustmentEntry {
  id: string;
  adjustmentValue: number;
  filterContext: FilterSelections;
  timestamp: string;
  inventoryItemName?: string;
}

interface AdjustmentHistoryProps {
  entries: AdjustmentEntry[];
  isLoading?: boolean;
}

export default function AdjustmentHistory({ entries, isLoading = false }: AdjustmentHistoryProps) {

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Adjustments</h3>
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-500">Loading adjustment history...</span>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Adjustments</h3>
        <div className="text-gray-500 text-center py-8">
          No adjustments have been made yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Adjustments</h3>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    entry.adjustmentValue > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {entry.adjustmentValue > 0 ? '+' : ''}{entry.adjustmentValue}%
                </span>
                <span className="text-sm text-gray-600">
                  {formatFilterContext(entry.filterContext, entry.inventoryItemName)}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>

            {/* Period info if available */}
            {entry.filterContext.dateRange.startDate && entry.filterContext.dateRange.endDate && (
              <div className="text-xs text-gray-500">
                Period: {entry.filterContext.dateRange.startDate} to {entry.filterContext.dateRange.endDate}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export type { AdjustmentEntry };