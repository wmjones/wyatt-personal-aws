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
}

export default function AdjustmentHistory({ entries }: AdjustmentHistoryProps) {
  console.log('AdjustmentHistory rendered with entries:', entries);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

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
