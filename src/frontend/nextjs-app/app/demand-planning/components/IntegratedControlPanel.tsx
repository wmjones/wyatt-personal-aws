'use client';

import { useState, useCallback, useMemo } from 'react';
import MultiSelectFilter from './MultiSelectFilter';
import SingleSelectFilter from './SingleSelectFilter';
import SimpleDateRangeFilter from './SimpleDateRangeFilter';
import { FilterSelections } from './FilterSidebar';
import { ForecastSeries } from '@/app/types/demand-planning';
import toast from 'react-hot-toast';
import {
  useStateOptions,
  useDMAOptions,
  useDCOptions,
  useInventoryItemOptions
} from '@/app/hooks/useDropdownOptions';
import { useFilteredOptions } from '../hooks/useHierarchicalMapping';

interface IntegratedControlPanelProps {
  // Filter props
  filterSelections: FilterSelections;
  onFilterSelectionChange: (selections: FilterSelections) => void;

  // Adjustment props
  forecastData?: ForecastSeries | null;
  currentAdjustmentValue: number;
  onAdjustmentChange: (adjustmentValue: number) => void;
  onSaveAdjustment: (adjustmentValue: number, filterContext: FilterSelections) => Promise<void>;

  className?: string;
}

export default function IntegratedControlPanel({
  filterSelections,
  onFilterSelectionChange,
  forecastData,
  currentAdjustmentValue,
  onAdjustmentChange,
  onSaveAdjustment,
  className = ''
}: IntegratedControlPanelProps) {
  const [localSelections, setLocalSelections] = useState<FilterSelections>(filterSelections);
  const [adjustmentValue, setAdjustmentValue] = useState(currentAdjustmentValue);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    adjustment: true
  });
  const [useTimeWindow, setUseTimeWindow] = useState(false);
  const [adjustmentTimeWindow, setAdjustmentTimeWindow] = useState({
    startDate: localSelections.dateRange.startDate,
    endDate: localSelections.dateRange.endDate
  });

  // Fetch dropdown options using TanStack Query
  const { data: stateOptions = [] } = useStateOptions();
  const { data: dmaOptions = [] } = useDMAOptions();
  const { data: dcOptions = [] } = useDCOptions();
  const { data: inventoryOptions = [] } = useInventoryItemOptions();

  // Get filtered options based on selected states
  const { isDMAAvailable, isDCAvailable } = useFilteredOptions(localSelections.states);

  // Mark unavailable options as disabled
  const filteredDMAOptions = useMemo(() => {
    return dmaOptions.map(option => ({
      ...option,
      disabled: !isDMAAvailable(option.value)
    }));
  }, [dmaOptions, isDMAAvailable]);

  const filteredDCOptions = useMemo(() => {
    return dcOptions.map(option => ({
      ...option,
      disabled: !isDCAvailable(option.value)
    }));
  }, [dcOptions, isDCAvailable]);

  // Remove unused variable
  // const isLoading = isLoadingStates || isLoadingDMAs || isLoadingDCs || isLoadingInventory || isLoadingHierarchy;

  // Toggle section expansion
  const toggleSection = (section: 'filters' | 'adjustment') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter handlers
  const handleStateChange = useCallback((states: string[]) => {
    const updatedSelections = {
      ...localSelections,
      states,
      dmaIds: [],
      dcIds: []
    };
    setLocalSelections(updatedSelections);
    onFilterSelectionChange(updatedSelections);
  }, [localSelections, onFilterSelectionChange]);

  const handleDmaChange = useCallback((dmaIds: string[]) => {
    const updatedSelections = {
      ...localSelections,
      dmaIds,
      dcIds: []
    };
    setLocalSelections(updatedSelections);
    onFilterSelectionChange(updatedSelections);
  }, [localSelections, onFilterSelectionChange]);

  const handleDcChange = useCallback((dcIds: string[]) => {
    const updatedSelections = {
      ...localSelections,
      dcIds
    };
    setLocalSelections(updatedSelections);
    onFilterSelectionChange(updatedSelections);
  }, [localSelections, onFilterSelectionChange]);

  const handleInventoryItemChange = useCallback((itemId: string | null) => {
    const updatedSelections = {
      ...localSelections,
      inventoryItemId: itemId
    };
    setLocalSelections(updatedSelections);
    onFilterSelectionChange(updatedSelections);
  }, [localSelections, onFilterSelectionChange]);

  const handleDateRangeChange = useCallback((dateRange: { startDate: string | null; endDate: string | null }) => {
    const updatedSelections = {
      ...localSelections,
      dateRange
    };
    setLocalSelections(updatedSelections);
    onFilterSelectionChange(updatedSelections);
  }, [localSelections, onFilterSelectionChange]);

  // Adjustment handlers
  const handleIncrement = () => {
    const newValue = adjustmentValue + 2.5;
    setAdjustmentValue(newValue);
    onAdjustmentChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = adjustmentValue - 2.5;
    setAdjustmentValue(newValue);
    onAdjustmentChange(newValue);
  };

  const handleAdjustmentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setAdjustmentValue(value);
    onAdjustmentChange(value);
  };

  const handleSaveAdjustment = async () => {
    if (adjustmentValue === 0) {
      toast.error('Please set an adjustment value');
      return;
    }

    setIsSaving(true);
    try {
      // Include time window in the filter context if enabled
      const adjustmentContext = {
        ...localSelections,
        ...(useTimeWindow ? {
          adjustmentDateRange: adjustmentTimeWindow
        } : {})
      };

      await onSaveAdjustment(adjustmentValue, adjustmentContext);
      setAdjustmentValue(0);
      onAdjustmentChange(0);
      setUseTimeWindow(false);
      setAdjustmentTimeWindow({
        startDate: localSelections.dateRange.startDate,
        endDate: localSelections.dateRange.endDate
      });
      toast.success('Adjustment saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save adjustment');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate filter summary for adjustment context
  const getFilterSummary = () => {
    const parts = [];

    if (localSelections.inventoryItemId && forecastData) {
      const item = forecastData.inventoryItems.find(i => i.id === localSelections.inventoryItemId);
      if (item) parts.push(`Item: ${item.name || item.id}`);
    }

    if (localSelections.states.length > 0) {
      parts.push(`States: ${localSelections.states.join(', ')}`);
    }

    if (localSelections.dmaIds.length > 0) {
      parts.push(`DMAs: ${localSelections.dmaIds.length}`);
    }

    if (localSelections.dcIds.length > 0) {
      parts.push(`DCs: ${localSelections.dcIds.length}`);
    }

    return parts.join(' • ');
  };

  return (
    <div className={`h-full overflow-y-auto bg-white dark:bg-gray-800 ${className}`}>
      <div className="p-4 space-y-4">
        {/* Filters Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <button
            onClick={() => toggleSection('filters')}
            className="w-full flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 p-2 -m-2 rounded-lg transition-colors"
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Filters
            </h3>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.filters ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.filters && (
            <div className="mt-4 space-y-4">
              {/* Inventory Item Selection */}
              <SingleSelectFilter
                title="Product"
                selectedValue={localSelections.inventoryItemId}
                onChange={handleInventoryItemChange}
                options={inventoryOptions}
                placeholder="Select a product..."
              />

              {/* State Selection */}
              <MultiSelectFilter
                title="States"
                selectedValues={localSelections.states}
                onChange={handleStateChange}
                options={stateOptions}
                placeholder="Select states..."
              />

              {/* DMA Selection */}
              <MultiSelectFilter
                title="DMAs"
                selectedValues={localSelections.dmaIds}
                onChange={handleDmaChange}
                options={filteredDMAOptions}
                placeholder="Select DMAs..."
              />

              {/* DC Selection */}
              <MultiSelectFilter
                title="Distribution Centers"
                selectedValues={localSelections.dcIds}
                onChange={handleDcChange}
                options={filteredDCOptions}
                placeholder="Select DCs..."
              />

              {/* Date Range Selection */}
              <SimpleDateRangeFilter
                startDate={localSelections.dateRange.startDate}
                endDate={localSelections.dateRange.endDate}
                onChange={handleDateRangeChange}
              />
            </div>
          )}
        </div>

        {/* Adjustment Section */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('adjustment')}
            className="w-full flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 p-2 -m-2 rounded-lg transition-colors"
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Forecast Adjustment
            </h3>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.adjustment ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.adjustment && forecastData && (
            <div className="mt-4 space-y-4">
              {/* Filter Context Display */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{getFilterSummary()}</p>
              </div>

              {/* Adjustment Controls */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adjustment %
                </label>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDecrement}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    disabled={isSaving}
                    title="Decrease by 2.5%"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    value={adjustmentValue}
                    onChange={handleAdjustmentInputChange}
                    step="0.1"
                    className="w-20 px-3 py-1 text-center border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isSaving}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">%</span>

                  <button
                    onClick={handleIncrement}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    disabled={isSaving}
                    title="Increase by 2.5%"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Time Window Selection */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={useTimeWindow}
                    onChange={(e) => setUseTimeWindow(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Apply to specific time window
                  </span>
                </label>

                {useTimeWindow && (
                  <div className="ml-6 space-y-2">
                    <SimpleDateRangeFilter
                      startDate={adjustmentTimeWindow.startDate}
                      endDate={adjustmentTimeWindow.endDate}
                      onChange={(dateRange) => setAdjustmentTimeWindow(dateRange)}
                      minDate={localSelections.dateRange.startDate}
                      maxDate={localSelections.dateRange.endDate}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Adjustment will only apply within this date range
                    </p>
                  </div>
                )}
              </div>

              {/* Impact Preview */}
              {adjustmentValue !== 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {adjustmentValue > 0 ? '+' : ''}{adjustmentValue}% adjustment
                    {useTimeWindow && adjustmentTimeWindow.startDate && adjustmentTimeWindow.endDate && (
                      <span className="block text-xs mt-1">
                        From {new Date(adjustmentTimeWindow.startDate).toLocaleDateString()} to {new Date(adjustmentTimeWindow.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveAdjustment}
                disabled={adjustmentValue === 0 || isSaving || !localSelections.inventoryItemId}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Adjustment'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
