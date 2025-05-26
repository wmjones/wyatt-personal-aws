'use client';

import { useState, useEffect } from 'react';
import MultiSelectFilter, { FilterOption } from './MultiSelectFilter';
import SingleSelectFilter from './SingleSelectFilter';
import { forecastService } from '@/app/services/forecastService';

export interface FilterSelections {
  states: string[];
  dmaIds: string[];
  dcIds: string[];
  inventoryItemId: string | null;
}

interface FilterSidebarProps {
  selections: FilterSelections;
  onSelectionChange: (selections: FilterSelections) => void;
  className?: string;
}

// Filter options will be loaded dynamically from Athena

export default function FilterSidebar({
  selections,
  onSelectionChange,
  className = ''
}: FilterSidebarProps) {
  const [localSelections, setLocalSelections] = useState<FilterSelections>(selections);

  // Dynamic filter options loaded from Athena
  const [stateOptions, setStateOptions] = useState<FilterOption[]>([]);
  const [dmaOptions, setDmaOptions] = useState<FilterOption[]>([]);
  const [dcOptions, setDcOptions] = useState<FilterOption[]>([]);
  const [inventoryOptions, setInventoryOptions] = useState<FilterOption[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [filterError, setFilterError] = useState<string | null>(null);

  // Load filter options from Athena on component mount - optimized for parallel loading
  useEffect(() => {
    const loadFilterOptions = async () => {
      setIsLoadingFilters(true);
      setFilterError(null);

      try {
        console.log('Loading filter options from Athena...');

        // Load all filter options in parallel for better performance
        const [states, dmaIds, dcIds, inventoryItems] = await Promise.all([
          forecastService.getDistinctStates(),
          forecastService.getDistinctDmaIds(),
          forecastService.getDistinctDcIds(),
          forecastService.getDistinctInventoryItems()
        ]);

        // Update all filter options at once to minimize re-renders
        setStateOptions(states.map(state => ({
          value: state,
          label: state
        })));

        setDmaOptions(dmaIds.map(dmaId => ({
          value: dmaId,
          label: `DMA ${dmaId}`
        })));

        setDcOptions(dcIds.map(dcId => ({
          value: dcId,
          label: `Distribution Center ${dcId}`
        })));

        setInventoryOptions(inventoryItems.map(itemId => ({
          value: itemId,
          label: `Item ${itemId}`
        })));

        console.log('Filter options loaded successfully:', {
          states: states.length,
          dmaIds: dmaIds.length,
          dcIds: dcIds.length,
          inventoryItems: inventoryItems.length
        });

        // Auto-select the first inventory item if none selected
        if (inventoryItems.length > 0 && !localSelections.inventoryItemId) {
          const autoSelection = {
            ...localSelections,
            inventoryItemId: inventoryItems[0]
          };
          setLocalSelections(autoSelection);
          onSelectionChange(autoSelection);
          console.log('Auto-selected first inventory item:', inventoryItems[0]);
        }

      } catch (error) {
        console.error('Error loading filter options:', error);
        setFilterError('Failed to load filter options. Please try refreshing the page.');
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadFilterOptions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Clear all selections (except inventory item which is required)
  const handleClearAll = () => {
    const clearedSelections: FilterSelections = {
      states: [],
      dmaIds: [],
      dcIds: [],
      inventoryItemId: localSelections.inventoryItemId // Keep inventory item selected
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
        {/* Loading State */}
        {isLoadingFilters && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dp-cfa-red mx-auto mb-2"></div>
            <p className="text-sm text-dp-text-secondary">Loading filter options...</p>
          </div>
        )}

        {/* Error State */}
        {filterError && (
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-2">{filterError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-dp-cfa-red hover:underline"
            >
              Refresh Page
            </button>
          </div>
        )}

        {/* Filter Controls - only show when not loading and no error */}
        {!isLoadingFilters && !filterError && (
          <>
            {/* Inventory Item Filter - Single Select */}
            <SingleSelectFilter
              title="Inventory Item"
              options={inventoryOptions}
              selectedValue={localSelections.inventoryItemId}
              onChange={(value) => {
                const newSelections = {
                  ...localSelections,
                  inventoryItemId: value
                };
                setLocalSelections(newSelections);
                onSelectionChange(newSelections);
              }}
              placeholder="Select inventory item..."
            />

            <div className="border-t border-dp-frame-border pt-4">
              <p className="text-xs text-dp-text-tertiary mb-4">
                Location filters (optional) - leave empty to view all locations
              </p>
            </div>

            {/* States Filter */}
            <MultiSelectFilter
              title="States"
              options={stateOptions}
              selectedValues={localSelections.states}
              onChange={(values) => handleFilterChange('states', values)}
              placeholder="Select states..."
              maxDisplayItems={2}
            />

            {/* DMA Filter */}
            <MultiSelectFilter
              title="DMA (Designated Market Areas)"
              options={dmaOptions}
              selectedValues={localSelections.dmaIds}
              onChange={(values) => handleFilterChange('dmaIds', values)}
              placeholder="Select DMAs..."
              maxDisplayItems={2}
            />

            {/* DC Filter */}
            <MultiSelectFilter
              title="Distribution Centers"
              options={dcOptions}
              selectedValues={localSelections.dcIds}
              onChange={(values) => handleFilterChange('dcIds', values)}
              placeholder="Select DCs..."
              maxDisplayItems={2}
            />
          </>
        )}
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
