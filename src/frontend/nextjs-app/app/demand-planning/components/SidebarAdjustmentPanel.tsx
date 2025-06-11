'use client';

import { useState } from 'react';
import { FilterSelections } from './FilterSidebar';
import toast from 'react-hot-toast';

interface SidebarAdjustmentPanelProps {
  filterSelections: FilterSelections;
  onAdjustmentChange: (adjustmentValue: number) => void;
  onSaveAdjustment: (adjustmentValue: number, filterContext: FilterSelections) => Promise<void>;
  inventoryItemName?: string;
}

export default function SidebarAdjustmentPanel({
  filterSelections,
  onAdjustmentChange,
  onSaveAdjustment,
  inventoryItemName
}: SidebarAdjustmentPanelProps) {
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Preset adjustment values
  const presets = [-20, -10, -5, 5, 10, 20];

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAdjustmentValue(value);
    onAdjustmentChange(value);
  };

  // Handle preset button click
  const handlePresetClick = (value: number) => {
    setAdjustmentValue(value);
    onAdjustmentChange(value);
  };

  // Handle save adjustment
  const handleSave = async () => {
    if (adjustmentValue === 0) {
      return;
    }

    setIsSaving(true);
    try {
      await onSaveAdjustment(adjustmentValue, filterSelections);
      // Reset adjustment value after successful save
      setAdjustmentValue(0);
      onAdjustmentChange(0);
      toast.success('Adjustment saved successfully');
    } catch (error) {
      // Show user-friendly error message
      toast.error(error instanceof Error ? error.message : 'Failed to save adjustment');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if we have valid selections for adjustment
  const hasValidSelection = filterSelections.inventoryItemId &&
    filterSelections.dateRange.startDate &&
    filterSelections.dateRange.endDate;

  if (!hasValidSelection) {
    return (
      <div className="border-t border-dp-frame-border pt-6">
        <h3 className="text-heading font-semibold text-dp-text-primary mb-3">Forecast Adjustment</h3>
        <p className="text-body text-dp-text-tertiary">
          Select a product and date range to enable adjustments.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-dp-frame-border pt-6">
      <h3 className="text-heading font-semibold text-dp-text-primary mb-4">Forecast Adjustment</h3>

      {/* Current adjustment value display */}
      <div className="text-center mb-4">
        <div className={`text-display font-semibold ${
          adjustmentValue > 0 ? 'text-dp-status-success' :
          adjustmentValue < 0 ? 'text-dp-status-error' :
          'text-dp-text-secondary'
        }`}>
          {adjustmentValue > 0 ? '+' : ''}{adjustmentValue}%
        </div>
        <div className="text-caption text-dp-text-tertiary mt-1">
          {inventoryItemName || 'Selected Product'}
        </div>
      </div>

      {/* Slider control */}
      <div className="mb-6">
        <input
          type="range"
          min="-50"
          max="50"
          step="1"
          value={adjustmentValue}
          onChange={handleSliderChange}
          disabled={isSaving}
          className="w-full h-2 bg-dp-background-secondary rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:bg-dp-cfa-red [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                     [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:shadow-md
                     disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Adjustment percentage"
        />

        {/* Slider labels */}
        <div className="flex justify-between mt-2">
          <span className="text-micro text-dp-text-tertiary">-50%</span>
          <span className="text-micro text-dp-text-tertiary">0%</span>
          <span className="text-micro text-dp-text-tertiary">+50%</span>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="mb-6">
        <div className="text-caption text-dp-text-secondary mb-2">Quick adjustments:</div>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              disabled={isSaving}
              className={`py-2 px-3 text-caption font-medium rounded-sm border transition-all
                ${adjustmentValue === preset
                  ? 'bg-dp-cfa-red text-white border-dp-cfa-red'
                  : 'bg-white text-dp-text-secondary border-dp-frame-border hover:border-dp-border-medium hover:bg-dp-background-secondary'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {preset > 0 ? '+' : ''}{preset}%
            </button>
          ))}
        </div>
      </div>

      {/* Period info */}
      <div className="mb-6 p-3 bg-dp-background-secondary rounded-sm">
        <div className="text-micro text-dp-text-tertiary mb-1">Adjustment period:</div>
        <div className="text-caption text-dp-text-secondary">
          {filterSelections.dateRange.startDate} to {filterSelections.dateRange.endDate}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setAdjustmentValue(0);
            onAdjustmentChange(0);
          }}
          disabled={adjustmentValue === 0 || isSaving}
          className="flex-1 py-2 px-4 text-body font-medium text-dp-text-secondary
                     bg-white border border-dp-frame-border rounded-sm
                     hover:bg-dp-background-secondary hover:border-dp-border-medium
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Reset
        </button>

        <button
          onClick={handleSave}
          disabled={adjustmentValue === 0 || isSaving}
          className="flex-1 py-2 px-4 text-body font-medium text-white
                     bg-dp-cfa-red border border-dp-cfa-red rounded-sm
                     hover:bg-dp-cfa-red-primary disabled:opacity-50
                     disabled:cursor-not-allowed transition-all
                     flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </div>
  );
}
