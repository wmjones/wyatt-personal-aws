'use client';

import { useState } from 'react';
import { FilterSelections } from './FilterSidebar';
import { ForecastSeries } from '@/app/types/demand-planning';

interface NewAdjustmentPanelProps {
  forecastData: ForecastSeries;
  filterSelections: FilterSelections;
  onAdjustmentChange: (adjustmentValue: number) => void;
  onSaveAdjustment: (adjustmentValue: number, filterContext: FilterSelections) => Promise<void>;
}

export default function NewAdjustmentPanel({
  forecastData,
  filterSelections,
  onAdjustmentChange,
  onSaveAdjustment
}: NewAdjustmentPanelProps) {
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to increment/decrement by 2.5%
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

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setAdjustmentValue(value);
    onAdjustmentChange(value);
  };

  // Handle save adjustment
  const handleSave = async () => {
    console.log('handleSave called with adjustmentValue:', adjustmentValue);
    if (adjustmentValue === 0) {
      console.log('Skipping save - adjustment value is 0');
      return;
    }

    console.log('Starting save process...');
    setIsSaving(true);
    try {
      console.log('Calling onSaveAdjustment with:', adjustmentValue, filterSelections);
      await onSaveAdjustment(adjustmentValue, filterSelections);
      console.log('Save successful, resetting adjustment value');
      // Reset adjustment value after successful save
      setAdjustmentValue(0);
      onAdjustmentChange(0);
    } catch (error) {
      console.error('Failed to save adjustment:', error);
      // Show user-friendly error message
      alert('Failed to save adjustment. Please check the console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate filter context summary for display
  const getFilterSummary = () => {
    const parts = [];

    if (filterSelections.inventoryItemId) {
      const item = forecastData.inventoryItems.find(i => i.id === filterSelections.inventoryItemId);
      if (item) parts.push(`Item: ${item.name || item.id}`);
    }

    if (filterSelections.states.length > 0) {
      parts.push(`States: ${filterSelections.states.join(', ')}`);
    }

    if (filterSelections.dmaIds.length > 0) {
      parts.push(`DMAs: ${filterSelections.dmaIds.length} selected`);
    }

    if (filterSelections.dcIds.length > 0) {
      parts.push(`DCs: ${filterSelections.dcIds.length} selected`);
    }

    if (filterSelections.dateRange.startDate && filterSelections.dateRange.endDate) {
      parts.push(`Period: ${filterSelections.dateRange.startDate} to ${filterSelections.dateRange.endDate}`);
    }

    return parts.join(' • ');
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Forecast Adjustment</h3>

      {/* Filter Context Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-1">Adjustment Target:</h4>
        <p className="text-sm text-gray-600">{getFilterSummary()}</p>
      </div>

      {/* Adjustment Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <label className="text-sm font-medium text-gray-700">
          Adjustment Percentage:
        </label>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDecrement}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
            disabled={isSaving}
            title="Decrease by 2.5%"
          >
            −
          </button>

          <input
            type="number"
            value={adjustmentValue}
            onChange={handleInputChange}
            step="0.1"
            className="w-20 px-3 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSaving}
          />
          <span className="text-sm text-gray-500">%</span>

          <button
            onClick={handleIncrement}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
            disabled={isSaving}
            title="Increase by 2.5%"
          >
            +
          </button>
        </div>
      </div>

      {/* Impact Preview */}
      {adjustmentValue !== 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Preview Impact:</h4>
          <p className="text-sm text-blue-700">
            {adjustmentValue > 0 ? '+' : ''}{adjustmentValue}% adjustment will be applied to the y_50 (median) forecast values
          </p>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={adjustmentValue === 0 || isSaving}
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
  );
}
