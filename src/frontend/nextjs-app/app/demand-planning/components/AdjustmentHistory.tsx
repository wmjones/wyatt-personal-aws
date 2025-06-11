'use client';

import { useState } from 'react';
import { FilterSelections } from './FilterSidebar';
import { formatFilterContext } from '../lib/adjustment-utils';
import AdjustmentContextMenu from './AdjustmentContextMenu';

interface AdjustmentEntry {
  id: string;
  adjustmentValue: number;
  filterContext: FilterSelections & {
    adjustmentDateRange?: {
      startDate: string | null;
      endDate: string | null;
    };
  };
  timestamp: string;
  inventoryItemName?: string;
  userEmail?: string;
  userName?: string;
  userId?: string;
  isOwn?: boolean;
  isActive?: boolean;
  adjustmentStartDate?: string | null;
  adjustmentEndDate?: string | null;
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
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    entry: AdjustmentEntry | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    entry: null
  });

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

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, entry: AdjustmentEntry) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      entry
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-white border-t border-dp-frame-border">
        <div className="flex justify-between items-center px-6 py-3 border-b border-dp-frame-border flex-shrink-0">
          <h3 className="text-heading font-semibold text-dp-text-primary">Recent Adjustments</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-dp-text-tertiary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-body text-dp-text-tertiary">Loading adjustment history...</span>
          </div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white border-t border-dp-frame-border">
        <div className="flex justify-between items-center px-6 py-3 border-b border-dp-frame-border flex-shrink-0">
          <h3 className="text-heading font-semibold text-dp-text-primary">Recent Adjustments</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-body text-dp-text-tertiary">
            No adjustments have been made yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-t border-dp-frame-border">
      <div className="flex justify-between items-center px-6 py-3 border-b border-dp-frame-border flex-shrink-0">
        <h3 className="text-heading font-semibold text-dp-text-primary">Recent Adjustments</h3>
        {onToggleShowAllUsers && (
          <div className="flex items-center gap-2">
            <span className="text-caption text-dp-text-tertiary">Show all users</span>
            <button
              onClick={() => onToggleShowAllUsers(!showAllUsers)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                showAllUsers ? 'bg-dp-cfa-red' : 'bg-dp-background-tertiary'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  showAllUsers ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4">
        <div className="flex gap-4 h-full">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`flex-shrink-0 w-80 border rounded-sm p-4 transition-all cursor-pointer ${
                entry.isActive !== false
                  ? 'border-dp-frame-border bg-white hover:border-dp-border-medium hover:shadow-dp-light'
                  : 'border-dp-frame-border bg-dp-background-secondary opacity-60'
              }`}
              onContextMenu={(e) => handleContextMenu(e, entry)}
            >
            <div className="flex flex-col h-full">
              {/* Header with adjustment value and timestamp */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-sm text-caption font-medium ${
                      entry.adjustmentValue > 0
                        ? 'bg-dp-status-success-bg text-dp-status-success'
                        : 'bg-dp-status-error-bg text-dp-status-error'
                    }`}
                  >
                    {entry.adjustmentValue > 0 ? '+' : ''}{entry.adjustmentValue}%
                  </span>
                  {entry.isActive === false && (
                    <span className="text-micro text-dp-text-tertiary italic">(Inactive)</span>
                  )}
                </div>
                <span className="text-micro text-dp-text-tertiary">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>

              {/* Filter context */}
              <div className="text-body text-dp-text-secondary mb-3 line-clamp-2">
                {formatFilterContext(entry.filterContext, entry.inventoryItemName)}
              </div>

              {/* Footer with user info and actions */}
              <div className="mt-auto">
                {/* Period and time window info */}
                <div className="space-y-1 mb-3">
                  {entry.filterContext.dateRange.startDate && entry.filterContext.dateRange.endDate && (
                    <div className="text-micro text-dp-text-tertiary">
                      Period: {entry.filterContext.dateRange.startDate} to {entry.filterContext.dateRange.endDate}
                    </div>
                  )}
                  {(entry.adjustmentStartDate || entry.filterContext.adjustmentDateRange?.startDate) && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-dp-status-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-micro text-dp-status-warning font-medium">
                        Window: {entry.adjustmentStartDate || entry.filterContext.adjustmentDateRange?.startDate} to {entry.adjustmentEndDate || entry.filterContext.adjustmentDateRange?.endDate}
                      </span>
                    </div>
                  )}
                </div>

                {/* User info and actions row */}
                <div className="flex justify-between items-end">
                  {entry.userName && (
                    <div className="text-micro text-dp-text-tertiary truncate mr-2">
                      By: {entry.userName}
                    </div>
                  )}

                  {/* Actions for own adjustments */}
                  {entry.isOwn && (onToggleActive || onDelete) && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {onToggleActive && (
                        <button
                          onClick={() => handleToggleActive(entry)}
                          disabled={actionLoading === entry.id}
                          className="text-micro text-dp-cfa-red hover:text-dp-cfa-red-primary disabled:opacity-50 font-medium"
                        >
                          {actionLoading === entry.id ? 'Loading...' : (entry.isActive !== false ? 'Deactivate' : 'Activate')}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => handleDelete(entry)}
                          disabled={actionLoading === entry.id}
                          className="text-micro text-dp-status-error hover:text-red-700 disabled:opacity-50 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Context Menu */}
      <AdjustmentContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, entry: null })}
        items={
          contextMenu.entry ? [
            {
              label: 'Copy adjustment details',
              action: () => {
                if (contextMenu.entry) {
                  const details = `${contextMenu.entry.adjustmentValue}% adjustment - ${formatFilterContext(contextMenu.entry.filterContext, contextMenu.entry.inventoryItemName)}`;
                  navigator.clipboard.writeText(details);
                }
              },
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )
            },
            ...(contextMenu.entry.isOwn && onToggleActive ? [{
              label: contextMenu.entry.isActive !== false ? 'Deactivate' : 'Activate',
              action: () => contextMenu.entry && handleToggleActive(contextMenu.entry),
              disabled: actionLoading === contextMenu.entry.id,
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={contextMenu.entry.isActive !== false ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
              )
            }] : []),
            ...(contextMenu.entry.isOwn && onDelete ? [{
              label: 'Delete',
              action: () => contextMenu.entry && handleDelete(contextMenu.entry),
              disabled: actionLoading === contextMenu.entry.id,
              variant: 'danger' as const,
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )
            }] : [])
          ] : []
        }
      />
    </div>
  );
}

export type { AdjustmentEntry };
