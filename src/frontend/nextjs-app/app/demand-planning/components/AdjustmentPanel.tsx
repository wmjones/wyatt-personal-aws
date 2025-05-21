'use client';

import { useState } from 'react';
import AdjustmentModal, { AdjustmentData } from './AdjustmentModal';
import {
  ForecastSeries,
  HierarchySelection
} from '@/app/types/demand-planning';

interface AdjustmentPanelProps {
  forecastData: ForecastSeries;
  isLoading: boolean;
  onApplyAdjustment: (adjustment: AdjustmentData) => Promise<void>;
  onResetAdjustments: () => Promise<void>;
  onRefreshForecast: () => Promise<void>;
  selectedHierarchies: HierarchySelection[];
}

export default function AdjustmentPanel({
  forecastData,
  isLoading,
  onApplyAdjustment,
  onResetAdjustments,
  onRefreshForecast,
  selectedHierarchies
}: AdjustmentPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate the baseline total
  const baselineTotal = forecastData.baseline.reduce((sum, point) => sum + point.value, 0);

  // Calculate adjusted total if available
  const adjustedTotal = forecastData.adjusted
    ? forecastData.adjusted.reduce((sum, point) => sum + point.value, 0)
    : baselineTotal;

  // Calculate change values
  const absoluteChange = adjustedTotal - baselineTotal;
  const percentageChange = baselineTotal > 0
    ? ((adjustedTotal / baselineTotal) - 1) * 100
    : 0;

  // Handle opening the adjustment modal
  const openAdjustmentModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="bg-dp-surface-primary p-4 shadow-dp-light border border-dp-border-light rounded-lg">
      <h2 className="text-lg font-medium mb-4 text-dp-text-primary border-b border-dp-border-light pb-2">Forecast Adjustments</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-dp-background-tertiary rounded-lg p-4">
          <div className="text-xs text-dp-text-secondary mb-1">Baseline Total</div>
          <div className="text-xl font-medium">{baselineTotal.toLocaleString()} units</div>
        </div>

        <div className="bg-dp-background-tertiary rounded-lg p-4">
          <div className="text-xs text-dp-text-secondary mb-1">Adjusted Total</div>
          <div className="text-xl font-medium">
            {forecastData.adjusted
              ? `${adjustedTotal.toLocaleString()} units`
              : 'No adjustments applied'}
          </div>
        </div>

        {forecastData.adjusted && (
          <div className="bg-dp-background-tertiary rounded-lg p-4">
            <div className="text-xs text-dp-text-secondary mb-1">Overall Change</div>
            <div
              className={`text-xl font-medium ${
                percentageChange > 0
                  ? 'text-dp-ui-positive'
                  : percentageChange < 0
                    ? 'text-dp-ui-negative'
                    : ''
              }`}
            >
              {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
              <span className="text-sm ml-1">
                ({absoluteChange > 0 ? '+' : ''}{absoluteChange.toLocaleString()})
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={openAdjustmentModal}
          className="dp-btn dp-btn-primary w-full flex items-center justify-center"
          disabled={isLoading || selectedHierarchies.length === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Adjustment
        </button>

        <button
          onClick={onResetAdjustments}
          className="dp-btn dp-btn-tertiary w-full border border-dp-border-medium"
          disabled={isLoading || !forecastData?.adjusted}
        >
          Reset All Adjustments
        </button>

        <button
          onClick={onRefreshForecast}
          className="dp-btn dp-btn-tertiary w-full border border-dp-border-light"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Forecast Data
        </button>
      </div>

      {/* Recent adjustments list - could be expanded in a future phase */}
      {forecastData.adjusted && (
        <div className="mt-6 border-t border-dp-border-light pt-4">
          <h3 className="text-sm font-medium mb-2 text-dp-text-primary">Recent Adjustments</h3>
          <div className="text-xs text-dp-text-secondary pt-1 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Last updated: {new Date(forecastData.lastUpdated).toLocaleString()}
          </div>
        </div>
      )}

      {/* Adjustment modal */}
      <AdjustmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={onApplyAdjustment}
        timePeriods={forecastData.timePeriods}
        selectedHierarchies={selectedHierarchies}
        baselineTotal={baselineTotal}
      />
    </div>
  );
}
