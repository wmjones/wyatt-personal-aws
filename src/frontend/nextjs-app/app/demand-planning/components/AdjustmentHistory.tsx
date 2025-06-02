'use client';

import { useState } from 'react';
import { FilterSelections } from './FilterSidebar';
import { formatFilterContext } from '../lib/adjustment-utils';

interface AdjustmentEntry {
  id: string;
  adjustmentValue: number;
  filterContext: FilterSelections;
  timestamp: string;
  inventoryItemName?: string;
  userEmail?: string;
  userName?: string;
  userId?: string;
  isOwn?: boolean;
  isActive?: boolean;
}

interface AdjustmentHistoryProps {
  entries: AdjustmentEntry[];
  isLoading?: boolean;
  onToggleActive?: (id: string, isActive: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  showAllUsers?: boolean;
  onToggleShowAllUsers?: (showAll: boolean) => void;
}

export default function AdjustmentHistory({
  entries,
  isLoading = false,
  onToggleActive,
  onDelete,
  showAllUsers = true,
  onToggleShowAllUsers
}: AdjustmentHistoryProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Handle toggle active/inactive
  const handleToggleActive = async (entry: AdjustmentEntry) => {
    if (!onToggleActive || !entry.isOwn) return;

    setActionLoading(entry.id);
    try {
      await onToggleActive(entry.id, !entry.isActive);
    } catch (error) {
      console.error('Failed to toggle adjustment:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete
  const handleDelete = async (entry: AdjustmentEntry) => {
    if (!onDelete || !entry.isOwn) return;

    if (!confirm('Are you sure you want to delete this adjustment?')) return;

    setActionLoading(entry.id);
    try {
      await onDelete(entry.id);
    } catch (error) {
      console.error('Failed to delete adjustment:', error);
    } finally {
      setActionLoading(null);
    }
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Adjustments</h3>
        {onToggleShowAllUsers && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show all users</span>
            <button
              onClick={() => onToggleShowAllUsers(!showAllUsers)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showAllUsers ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showAllUsers ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`border rounded-md p-4 transition-colors ${
              entry.isActive !== false
                ? 'border-gray-200 hover:bg-gray-50'
                : 'border-gray-300 bg-gray-100 opacity-60'
            }`}
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
                {entry.isActive === false && (
                  <span className="text-xs text-gray-500 italic">(Inactive)</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>
            </div>

            {/* User info and period info */}
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                {/* Period info if available */}
                {entry.filterContext.dateRange.startDate && entry.filterContext.dateRange.endDate && (
                  <div className="text-xs text-gray-500">
                    Period: {entry.filterContext.dateRange.startDate} to {entry.filterContext.dateRange.endDate}
                  </div>
                )}
                {/* User info */}
                {entry.userName && (
                  <div className="text-xs text-gray-500">
                    By: {entry.userName} {entry.userEmail && `(${entry.userEmail})`}
                  </div>
                )}
              </div>

              {/* Actions for own adjustments */}
              {entry.isOwn && (onToggleActive || onDelete) && (
                <div className="flex items-center space-x-2">
                  {onToggleActive && (
                    <button
                      onClick={() => handleToggleActive(entry)}
                      disabled={actionLoading === entry.id}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {actionLoading === entry.id ? 'Loading...' : (entry.isActive !== false ? 'Deactivate' : 'Activate')}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(entry)}
                      disabled={actionLoading === entry.id}
                      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { AdjustmentEntry };
