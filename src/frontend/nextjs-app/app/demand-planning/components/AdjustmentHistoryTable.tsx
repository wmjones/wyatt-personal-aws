'use client';

import { useState } from 'react';
import { AdjustmentHistoryEntry, AdjustmentReason } from '@/app/types/demand-planning';
import { useAuth } from '@/app/context/AuthContext';
import { updateAdjustment, deleteAdjustment } from '../services/adjustmentService';

interface AdjustmentHistoryTableProps {
  entries: AdjustmentHistoryEntry[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function AdjustmentHistoryTable({
  entries,
  isLoading = false,
  onRefresh
}: AdjustmentHistoryTableProps) {
  const { user } = useAuth();
  const [sortField, setSortField] = useState<keyof AdjustmentHistoryEntry>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState<AdjustmentReason | 'all'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if current user can edit an adjustment
  const canEditAdjustment = (adjustment: AdjustmentHistoryEntry): boolean => {
    if (!user) return false;
    return adjustment.userId === user.attributes.sub;
  };

  // Format reason for display
  const formatReason = (reason: AdjustmentReason): string => {
    return reason
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle sorting
  const handleSort = (field: keyof AdjustmentHistoryEntry) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle toggle active/inactive
  const handleToggleActive = async (adjustment: AdjustmentHistoryEntry) => {
    if (!canEditAdjustment(adjustment)) return;

    setActionLoading(adjustment.id);
    try {
      await updateAdjustment(adjustment.id, { isActive: !adjustment.isActive });
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update adjustment:', error);
      alert(error instanceof Error ? error.message : 'Failed to update adjustment');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete adjustment
  const handleDelete = async (adjustment: AdjustmentHistoryEntry) => {
    if (!canEditAdjustment(adjustment)) return;

    if (!confirm('Are you sure you want to delete this adjustment?')) return;

    setActionLoading(adjustment.id);
    try {
      await deleteAdjustment(adjustment.id);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to delete adjustment:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete adjustment');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter and sort entries
  const filteredAndSortedEntries = entries
    .filter(entry => {
      // Apply reason filter
      if (reasonFilter !== 'all' && entry.reason !== reasonFilter) {
        return false;
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          entry.createdBy.toLowerCase().includes(searchLower) ||
          formatReason(entry.reason).toLowerCase().includes(searchLower) ||
          entry.notes?.toLowerCase().includes(searchLower) ||
          false
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Sort entries
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });

  // Get all available reasons from entries
  const availableReasons = Array.from(
    new Set(entries.map(entry => entry.reason))
  );

  // Render the sort indicator
  const renderSortIndicator = (field: keyof AdjustmentHistoryEntry) => {
    if (sortField !== field) return null;

    return sortDirection === 'asc'
      ? <span className="ml-1">↑</span>
      : <span className="ml-1">↓</span>;
  };

  if (isLoading) {
    return (
      <div className="bg-dp-surface-primary rounded-lg border border-dp-border-light shadow-dp-medium p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-dp-background-tertiary rounded mb-4"></div>
          <div className="h-64 bg-dp-background-tertiary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dp-surface-primary rounded-lg border border-dp-border-light shadow-dp-medium p-4">
      <h2 className="text-lg font-medium mb-4 text-dp-text-primary border-b border-dp-border-light pb-2">Adjustment History</h2>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search adjustments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dp-input w-full"
          />
        </div>

        <div>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value as AdjustmentReason | 'all')}
            className="dp-select w-full md:w-auto"
          >
            <option value="all">All Reasons</option>
            {availableReasons.map(reason => (
              <option key={reason} value={reason}>
                {formatReason(reason)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="text-dp-text-secondary">
            <tr>
              <th
                className="px-4 py-2 text-left cursor-pointer whitespace-nowrap font-medium border-b border-dp-border-light"
                onClick={() => handleSort('createdAt')}
              >
                Date {renderSortIndicator('createdAt')}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer whitespace-nowrap font-medium border-b border-dp-border-light"
                onClick={() => handleSort('value')}
              >
                Adjustment {renderSortIndicator('value')}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer whitespace-nowrap font-medium border-b border-dp-border-light"
                onClick={() => handleSort('reason')}
              >
                Reason {renderSortIndicator('reason')}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer whitespace-nowrap font-medium border-b border-dp-border-light"
                onClick={() => handleSort('createdBy')}
              >
                User {renderSortIndicator('createdBy')}
              </th>
              <th className="px-4 py-2 text-left whitespace-nowrap font-medium border-b border-dp-border-light">Impact</th>
              <th className="px-4 py-2 text-left whitespace-nowrap font-medium border-b border-dp-border-light">Status</th>
              <th className="px-4 py-2 text-left whitespace-nowrap font-medium border-b border-dp-border-light">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEntries.length > 0 ? (
              filteredAndSortedEntries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={index % 2 === 0 ? 'bg-dp-surface-primary hover:bg-dp-background-tertiary transition-colors' : 'bg-dp-background-tertiary hover:bg-dp-background-tertiary transition-colors'}
                >
                  <td className="px-4 py-3 whitespace-nowrap border-b border-dp-border-light">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-b border-dp-border-light">
                    {entry.type === 'percentage'
                      ? `${entry.value > 0 ? '+' : ''}${entry.value}%`
                      : `${entry.value > 0 ? '+' : ''}${entry.value} units`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-b border-dp-border-light">
                    {/* Status pills similar to reference */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.reason === 'supply-chain' || entry.reason === 'product-performance'
                          ? 'bg-dp-status-shipped text-dp-status-shipped-text'
                          : 'bg-dp-status-acknowledged text-dp-status-acknowledged-text'
                      }`}
                    >
                      {formatReason(entry.reason)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-b border-dp-border-light">
                    <div className="flex flex-col">
                      <span className="font-medium">{entry.createdBy}</span>
                      {entry.userEmail && (
                        <span className="text-xs text-dp-text-secondary">{entry.userEmail}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-b border-dp-border-light">
                    <span
                      className={
                        entry.impact.percentageChange > 0
                          ? 'text-dp-ui-positive font-medium'
                          : entry.impact.percentageChange < 0
                            ? 'text-dp-ui-negative font-medium'
                            : ''
                      }
                    >
                      {entry.impact.percentageChange > 0 ? '+' : ''}
                      {entry.impact.percentageChange.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-b border-dp-border-light">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.isActive !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {entry.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-b border-dp-border-light">
                    {canEditAdjustment(entry) ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(entry)}
                          disabled={actionLoading === entry.id}
                          className="text-xs text-dp-interactive-primary hover:text-dp-interactive-hover disabled:opacity-50"
                        >
                          {actionLoading === entry.id ? 'Loading...' : (entry.isActive !== false ? 'Deactivate' : 'Activate')}
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          disabled={actionLoading === entry.id}
                          className="text-xs text-dp-ui-negative hover:text-dp-ui-negative-hover disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-dp-text-secondary italic">View only</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-dp-text-secondary border-b border-dp-border-light">
                  {searchTerm || reasonFilter !== 'all'
                    ? 'No adjustments match your filters'
                    : 'No adjustment history found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 flex justify-between items-center text-xs text-dp-text-secondary">
        <span>Showing {filteredAndSortedEntries.length} of {entries.length} adjustments</span>
        {entries.length > 0 && (
          <span className="text-dp-interactive-primary">
            You can edit adjustments created by: {user?.email || 'Loading...'}
          </span>
        )}
      </div>
    </div>
  );
}
