'use client';

import { useState, useEffect } from 'react';
import MultiSelectFilter from './MultiSelectFilter';
import SingleSelectFilter from './SingleSelectFilter';
import DateRangeFilter from './DateRangeFilter';
import SidebarAdjustmentPanel from './SidebarAdjustmentPanel';
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
  // Adjustment panel props
  onAdjustmentChange?: (value: number) => void;
  onSaveAdjustment?: (value: number, filterContext: FilterSelections) => Promise<void>;
  showAdjustmentPanel?: boolean;
}

export default function FilterSidebar({
  selections,
  onSelectionChange,
  className = '',
  onAdjustmentChange,
  onSaveAdjustment,
  showAdjustmentPanel = true
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

  // Sync local selections with parent when they change
  useEffect(() => {
    setLocalSelections(selections);
  }, [selections]);

  // Handle state selection changes
  const handleStateChange = (states: string[]) => {
    const updatedSelections = {
      ...localSelections,
      states
    };
    setLocalSelections(updatedSelections);
    onSelectionChange(updatedSelections);
  };

  // Handle DMA selection changes
  const handleDmaChange = (dmaIds: string[]) => {
    const updatedSelections = {
      ...localSelections,
      dmaIds
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
      <aside className={`w-64 bg-white shadow-md p-6 ${className}`}>
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
    <aside className={`filter-sidebar bg-[#FAFAFA] p-dp-lg ${className}`}>
      <h2 className="text-heading font-semibold mb-dp-lg">Filters</h2>

      <div className="flex flex-col gap-dp-md">
        {/* Inventory Item Selection */}
        <div className="flex flex-col gap-dp-xs">
          <h3 className="text-caption font-medium text-dp-text-secondary">Inventory Item</h3>
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
        <div className="flex flex-col gap-dp-xs">
          <h3 className="text-caption font-medium text-dp-text-secondary">States</h3>
          <MultiSelectFilter
            title=""
            options={stateOptions}
            selectedValues={localSelections.states}
            onChange={handleStateChange}
            placeholder={isLoadingStates ? "Loading..." : "Select states"}
          />
        </div>

        {/* DMA Selection */}
        <div className="flex flex-col gap-dp-xs">
          <h3 className="text-caption font-medium text-dp-text-secondary">DMAs</h3>
          <MultiSelectFilter
            title=""
            options={dmaOptions}
            selectedValues={localSelections.dmaIds}
            onChange={handleDmaChange}
            placeholder={isLoadingDMAs ? "Loading..." : "Select DMAs"}
          />
        </div>

        {/* DC Selection */}
        <div className="flex flex-col gap-dp-xs">
          <h3 className="text-caption font-medium text-dp-text-secondary">Distribution Centers</h3>
          <MultiSelectFilter
            title=""
            options={dcOptions}
            selectedValues={localSelections.dcIds}
            onChange={handleDcChange}
            placeholder={isLoadingDCs ? "Loading..." : "Select DCs"}
          />
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col gap-dp-xs">
          <h3 className="text-caption font-medium text-dp-text-secondary">Date Range</h3>
          <DateRangeFilter
            value={{
              startDate: localSelections.dateRange?.startDate ? new Date(localSelections.dateRange.startDate) : null,
              endDate: localSelections.dateRange?.endDate ? new Date(localSelections.dateRange.endDate) : null
            }}
            onChange={(range) => {
              // Ensure range is defined and has the expected structure
              const updatedSelections = {
                ...localSelections,
                dateRange: {
                  startDate: range?.startDate instanceof Date ? range.startDate.toISOString().split('T')[0] : null,
                  endDate: range?.endDate instanceof Date ? range.endDate.toISOString().split('T')[0] : null
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
        <div className="mt-dp-md text-caption text-dp-text-tertiary">
          Loading filter options...
        </div>
      )}

      {/* Adjustment Panel */}
      {showAdjustmentPanel && onAdjustmentChange && onSaveAdjustment && (
        <div className="mt-dp-lg">
          <SidebarAdjustmentPanel
            filterSelections={localSelections}
            onAdjustmentChange={onAdjustmentChange}
            onSaveAdjustment={onSaveAdjustment}
            inventoryItemName={
              inventoryOptions.find(opt => opt.value === localSelections.inventoryItemId)?.label
            }
          />
        </div>
      )}
    </aside>
  );
}
