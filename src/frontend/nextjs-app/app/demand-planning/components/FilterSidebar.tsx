'use client';

import { useState, useEffect } from 'react';
import MultiSelectFilter, { FilterOption } from './MultiSelectFilter';

export interface FilterSelections {
  states: string[];
  dmaIds: string[];
  dcIds: string[];
}

interface FilterSidebarProps {
  selections: FilterSelections;
  onSelectionChange: (selections: FilterSelections) => void;
  className?: string;
}

// Generate US state options (based on data requirements - 5 unique states)
const US_STATES: FilterOption[] = [
  { value: 'CA', label: 'California (CA)' },
  { value: 'TX', label: 'Texas (TX)' },
  { value: 'FL', label: 'Florida (FL)' },
  { value: 'NY', label: 'New York (NY)' },
  { value: 'IL', label: 'Illinois (IL)' },
];

// Generate DMA options (based on data requirements - 30 unique 3-letter codes)
// Using deterministic generation for consistency
const generateDMACodes = (): string[] => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const codes: string[] = [];
  let seed = 42; // Deterministic seed

  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < 30; i++) {
    const code = Array.from({ length: 3 }, () =>
      letters[Math.floor(seededRandom() * letters.length)]
    ).join('');
    codes.push(code);
  }
  return codes;
};

const DMA_CODES = generateDMACodes();
const DMA_OPTIONS: FilterOption[] = DMA_CODES.map((code, i) => ({
  value: code,
  label: `${code} (DMA ${String(i + 1).padStart(3, '0')})`
}));

// Generate DC options (based on data requirements - 60 unique integer IDs)
const DC_OPTIONS: FilterOption[] = Array.from({ length: 60 }, (_, i) => ({
  value: String(i + 1),
  label: `Distribution Center ${i + 1}`
}));

export default function FilterSidebar({
  selections,
  onSelectionChange,
  className = ''
}: FilterSidebarProps) {
  const [localSelections, setLocalSelections] = useState<FilterSelections>(selections);

  // Update local state when props change
  useEffect(() => {
    setLocalSelections(selections);
  }, [selections]);

  // Handle filter changes
  const handleFilterChange = (filterType: keyof FilterSelections, values: string[]) => {
    const newSelections = {
      ...localSelections,
      [filterType]: values
    };
    setLocalSelections(newSelections);
    onSelectionChange(newSelections);
  };

  // Clear all selections
  const handleClearAll = () => {
    const clearedSelections: FilterSelections = {
      states: [],
      dmaIds: [],
      dcIds: []
    };
    setLocalSelections(clearedSelections);
    onSelectionChange(clearedSelections);
  };

  // Get total number of selected items
  const totalSelected = localSelections.states.length +
                       localSelections.dmaIds.length +
                       localSelections.dcIds.length;

  return (
    <div className={`bg-dp-surface-primary border border-dp-frame-border rounded-lg shadow-dp-medium h-fit ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-dp-frame-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dp-text-primary">
            Filters
          </h3>
          {totalSelected > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-dp-text-tertiary hover:text-dp-text-secondary font-medium"
            >
              Clear All
            </button>
          )}
        </div>
        {totalSelected > 0 && (
          <p className="text-sm text-dp-text-secondary mt-1">
            {totalSelected} filter{totalSelected !== 1 ? 's' : ''} active
          </p>
        )}
      </div>

      {/* Filter Controls */}
      <div className="p-4 space-y-6">
        {/* States Filter */}
        <MultiSelectFilter
          title="States"
          options={US_STATES}
          selectedValues={localSelections.states}
          onChange={(values) => handleFilterChange('states', values)}
          placeholder="Select states..."
          searchPlaceholder="Search states..."
          maxDisplayItems={2}
        />

        {/* DMA Filter */}
        <MultiSelectFilter
          title="DMA (Designated Market Areas)"
          options={DMA_OPTIONS}
          selectedValues={localSelections.dmaIds}
          onChange={(values) => handleFilterChange('dmaIds', values)}
          placeholder="Select DMAs..."
          searchPlaceholder="Search DMAs..."
          maxDisplayItems={2}
        />

        {/* DC Filter */}
        <MultiSelectFilter
          title="Distribution Centers"
          options={DC_OPTIONS}
          selectedValues={localSelections.dcIds}
          onChange={(values) => handleFilterChange('dcIds', values)}
          placeholder="Select DCs..."
          searchPlaceholder="Search DCs..."
          maxDisplayItems={2}
        />
      </div>

      {/* Selected Items Summary */}
      {totalSelected > 0 && (
        <div className="px-4 py-3 border-t border-dp-frame-border bg-dp-surface-secondary/50">
          <h4 className="text-sm font-medium text-dp-text-primary mb-2">
            Active Filters
          </h4>
          <div className="space-y-1 text-xs text-dp-text-secondary">
            {localSelections.states.length > 0 && (
              <div>
                <span className="font-medium">States:</span> {localSelections.states.length} selected
              </div>
            )}
            {localSelections.dmaIds.length > 0 && (
              <div>
                <span className="font-medium">DMAs:</span> {localSelections.dmaIds.length} selected
              </div>
            )}
            {localSelections.dcIds.length > 0 && (
              <div>
                <span className="font-medium">DCs:</span> {localSelections.dcIds.length} selected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
