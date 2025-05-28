'use client';

import { useState, useEffect } from 'react';
import MultiSelectFilter from './MultiSelectFilter';
import SingleSelectFilter from './SingleSelectFilter';
import DateRangeFilter from './DateRangeFilter';
import {
  useStateOptions,
  useDMAOptions,
  useDCOptions,
  useInventoryItemOptions
} from '@/app/hooks/useDropdownOptions';

export interface FilterSelections {
  states: string[];
  dmaIds: string[];
  dcIds: string[];
  inventoryItemId: string | null;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

interface FilterSidebarProps {
  selections: FilterSelections;
  onSelectionChange: (selections: FilterSelections) => void;
  className?: string;
}

export default function FilterSidebar({
  selections,
  onSelectionChange,
  className = ''
}: FilterSidebarProps) {
  const [localSelections, setLocalSelections] = useState<FilterSelections>(selections);

  // Fetch dropdown options using TanStack Query
  const { data: stateOptions = [], isLoading: isLoadingStates, error: statesError } = useStateOptions();
  const { data: dmaOptions = [], isLoading: isLoadingDMAs, error: dmasError } = useDMAOptions();
  const { data: dcOptions = [], isLoading: isLoadingDCs, error: dcsError } = useDCOptions();
  const { data: inventoryOptions = [], isLoading: isLoadingInventory, error: inventoryError } = useInventoryItemOptions();

  // Aggregate loading and error states
  const isLoading = isLoadingStates || isLoadingDMAs || isLoadingDCs || isLoadingInventory;
  const error = statesError || dmasError || dcsError || inventoryError;

  // Initialize with first inventory item and default date range if not selected
  useEffect(() => {
    let hasChanges = false;
    const updatedSelections = { ...localSelections };

    // Auto-select first inventory item if none selected
    if (!updatedSelections.inventoryItemId && inventoryOptions.length > 0 && !isLoadingInventory) {
      console.log('Auto-selecting first inventory item:', inventoryOptions[0]);
      updatedSelections.inventoryItemId = inventoryOptions[0].value;
      hasChanges = true;
    }

    // Set default date range if not selected (full data range)
    if (!updatedSelections.dateRange.startDate || !updatedSelections.dateRange.endDate) {
      updatedSelections.dateRange = {
        startDate: '2025-01-01',
        endDate: '2025-03-31'
      };
      hasChanges = true;
    }

    if (hasChanges) {
      setLocalSelections(updatedSelections);
      onSelectionChange(updatedSelections);
    }
  }, [inventoryOptions, isLoadingInventory]); // Remove localSelections and onSelectionChange from deps to avoid infinite loop

  // Handle state selection changes
  const handleStateChange = (states: string[]) => {
    const updatedSelections = {
      ...localSelections,
      states,
      // Clear dependent selections when states change
      dmaIds: [],
      dcIds: []
    };
    setLocalSelections(updatedSelections);
    onSelectionChange(updatedSelections);
  };

  // Handle DMA selection changes
  const handleDmaChange = (dmaIds: string[]) => {
    const updatedSelections = {
      ...localSelections,
      dmaIds,
      // Clear dependent selections when DMAs change
      dcIds: []
    };
    setLocalSelections(updatedSelections);
    onSelectionChange(updatedSelections);
  };

  // Handle DC selection changes
  const handleDcChange = (dcIds: string[]) => {
    const updatedSelections = {
      ...localSelections,
      dcIds
    };
    setLocalSelections(updatedSelections);
    onSelectionChange(updatedSelections);
  };

  // Handle inventory item selection
  const handleInventoryChange = (inventoryItemId: string | null) => {
    const updatedSelections = {
      ...localSelections,
      inventoryItemId
    };
    setLocalSelections(updatedSelections);
    onSelectionChange(updatedSelections);
  };

  // No transformation needed - the hooks already return the correct format
  // FilterOption type is an alias for DropdownOption

  if (error) {
    return (
      <aside className={`w-64 bg-white dark:bg-gray-800 shadow-md p-4 ${className}`}>
        <div className="text-red-500">
          <h3 className="font-semibold mb-2">Error Loading Filters</h3>
          <p className="text-sm">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-blue-500 hover:text-blue-700"
          >
            Reload Page
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`w-64 bg-white dark:bg-gray-800 shadow-md p-4 ${className}`}>
      <h2 className="text-lg font-semibold mb-4">Filters</h2>

      <div className="space-y-4">
        {/* Inventory Item Selection */}
        <div>
          <h3 className="text-sm font-medium mb-2">Inventory Item</h3>
          <SingleSelectFilter
            title=""
            options={inventoryOptions}
            selectedValue={localSelections.inventoryItemId}
            onChange={handleInventoryChange}
            placeholder={isLoadingInventory ? "Loading..." : "Select an item"}
            disabled={isLoadingInventory}
          />
        </div>

        {/* State Selection */}
        <div>
          <h3 className="text-sm font-medium mb-2">States</h3>
          <MultiSelectFilter
            title=""
            options={stateOptions}
            selectedValues={localSelections.states}
            onChange={handleStateChange}
            placeholder={isLoadingStates ? "Loading..." : "Select states"}
          />
        </div>

        {/* DMA Selection */}
        <div>
          <h3 className="text-sm font-medium mb-2">DMAs</h3>
          <MultiSelectFilter
            title=""
            options={dmaOptions}
            selectedValues={localSelections.dmaIds}
            onChange={handleDmaChange}
            placeholder={isLoadingDMAs ? "Loading..." : "Select DMAs"}
          />
        </div>

        {/* DC Selection */}
        <div>
          <h3 className="text-sm font-medium mb-2">Distribution Centers</h3>
          <MultiSelectFilter
            title=""
            options={dcOptions}
            selectedValues={localSelections.dcIds}
            onChange={handleDcChange}
            placeholder={isLoadingDCs ? "Loading..." : "Select DCs"}
          />
        </div>

        {/* Date Range Filter */}
        <div>
          <h3 className="text-sm font-medium mb-2">Date Range</h3>
          <DateRangeFilter
            value={{
              startDate: localSelections.dateRange.startDate ? new Date(localSelections.dateRange.startDate) : null,
              endDate: localSelections.dateRange.endDate ? new Date(localSelections.dateRange.endDate) : null
            }}
            onChange={(range) => {
              const updatedSelections = {
                ...localSelections,
                dateRange: {
                  startDate: range.startDate ? range.startDate.toISOString().split('T')[0] : null,
                  endDate: range.endDate ? range.endDate.toISOString().split('T')[0] : null
                }
              };
              setLocalSelections(updatedSelections);
              onSelectionChange(updatedSelections);
            }}
          />
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-4 text-sm text-gray-500">
          Loading filter options...
        </div>
      )}
    </aside>
  );
}
