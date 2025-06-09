'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { FilterSelections } from './components/FilterSidebar';
import useForecast from './hooks/useForecast';
import CacheStatus from './components/CacheStatus';
import AdjustmentHistory from './components/AdjustmentHistory';
import useAdjustmentHistory from './hooks/useAdjustmentHistory';
import AdjustmentDebugPanel from './components/AdjustmentDebugPanel';
import FloatingAdjustmentToolbar from './components/FloatingAdjustmentToolbar';
import { FilterPillContainer, FilterDropdown } from './components/FilterPills';
import { useInventoryItemOptions } from '@/app/hooks/useDropdownOptions';

// Lazy load the heavy chart component
const ForecastCharts = lazy(() => import('./components/ForecastCharts'));

export default function DemandPlanningPage() {
  // Get inventory options to set default
  const { data: inventoryOptions = [] } = useInventoryItemOptions();

  // Track if we've initialized the default inventory item
  const [hasInitializedDefault, setHasInitializedDefault] = useState(false);

  // Filter selections state with proper defaults
  const [filterSelections, setFilterSelections] = useState<FilterSelections>({
    states: [],
    dmaIds: [],
    dcIds: [],
    inventoryItemId: '152', // Default to item 152
    dateRange: { startDate: '2025-01-01', endDate: '2025-03-31' }
  });

  const [activeTab, setActiveTab] = useState<'forecast' | 'history' | 'settings'>('forecast');

  // Real-time adjustment state
  const [currentAdjustmentValue, setCurrentAdjustmentValue] = useState(0);

  // Filter dropdown state
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<keyof FilterSelections | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);

  // Use adjustment history hook for better state management
  const {
    adjustmentHistory,
    isLoading: isLoadingHistory,
    error: historyError,
    showAllUsers,
    setShowAllUsers,
    saveAdjustment,
    toggleAdjustmentActive,
    deleteAdjustment
  } = useAdjustmentHistory();

  // Set default inventory item only if current selection is invalid
  useEffect(() => {
    if (inventoryOptions.length > 0 && !hasInitializedDefault) {
      // Only update if the current inventoryItemId is not in the options
      const currentItemValid = inventoryOptions.some(opt => opt.value === filterSelections.inventoryItemId);
      if (!currentItemValid) {
        setFilterSelections(prev => ({
          ...prev,
          inventoryItemId: inventoryOptions[0].value
        }));
      }
      setHasInitializedDefault(true);
    }
  }, [inventoryOptions, hasInitializedDefault, filterSelections.inventoryItemId]);

  // Fetch forecast data using TanStack Query
  const {
    forecastData,
    isLoading: isLoadingForecast,
    error: forecastError,
    refetch: refetchForecast
  } = useForecast({
    filterSelections,
  });

  // Handle filter changes from FilterSidebar
  const handleFilterChange = (newSelections: FilterSelections) => {
    console.log('Page - Filter change:', newSelections);
    setFilterSelections(newSelections);
  };

  // Handle real-time adjustment changes
  const handleAdjustmentChange = (adjustmentValue: number) => {
    setCurrentAdjustmentValue(adjustmentValue);
  };

  // Handle saving adjustments
  const handleSaveAdjustment = async (adjustmentValue: number, filterContext: FilterSelections) => {
    // Get inventory item name for display
    const inventoryItemName = forecastData?.inventoryItems.find(
      item => item.id === filterContext.inventoryItemId
    )?.name;

    // Use the hook's saveAdjustment method
    await saveAdjustment(adjustmentValue, filterContext, inventoryItemName);

    // Reset current adjustment value
    setCurrentAdjustmentValue(0);

    // Refetch forecast data to include the saved adjustment
    await refetchForecast();
  };

  // Remove the manual loading as it's handled by the hook

  // Handle filter pill interactions
  const handleEditFilter = (filterType: keyof FilterSelections, event: React.MouseEvent<HTMLElement>) => {
    setActiveFilterType(filterType);
    setFilterAnchorEl(event.currentTarget);
    setFilterDropdownOpen(true);
  };

  const handleRemoveFilter = (filterType: keyof FilterSelections, value?: string) => {
    switch (filterType) {
      case 'states':
        if (value) {
          setFilterSelections(prev => ({
            ...prev,
            states: prev.states.filter(s => s !== value)
          }));
        }
        break;
      case 'dmaIds':
        setFilterSelections(prev => ({
          ...prev,
          dmaIds: []
        }));
        break;
      case 'dcIds':
        setFilterSelections(prev => ({
          ...prev,
          dcIds: []
        }));
        break;
      // Note: inventoryItemId and dateRange are required and cannot be removed
    }
  };

  // Calculate available periods based on forecast data (removed - not used)
  // const availablePeriods = forecastData?.timePeriods || [];

  return (
    <DashboardLayout
      filterSelections={filterSelections}
      onFilterSelectionChange={handleFilterChange}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      forecastData={forecastData}
      currentAdjustmentValue={currentAdjustmentValue}
      onAdjustmentChange={handleAdjustmentChange}
      onSaveAdjustment={handleSaveAdjustment}
      useIntegratedPanel={false} // Disable integrated panel to use floating toolbar
    >
      {/* Floating Adjustment Toolbar - shows when filters are selected */}
      <FloatingAdjustmentToolbar
        isVisible={activeTab === 'forecast' && !!filterSelections.inventoryItemId}
        onAdjustmentChange={handleAdjustmentChange}
        onSaveAdjustment={handleSaveAdjustment}
        filterSelections={filterSelections}
      />

      {/* Main content area based on active tab */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Forecast Overview</h2>
          </div>

          {/* Filter Pills */}
          <FilterPillContainer
            filterSelections={filterSelections}
            forecastData={forecastData}
            onRemoveFilter={handleRemoveFilter}
            onEditFilter={(filterType) => {
              // Create a synthetic event for the anchor element
              const event = { currentTarget: document.activeElement } as React.MouseEvent<HTMLElement>;
              handleEditFilter(filterType, event);
            }}
          />

          {/* Filter Dropdown */}
          <FilterDropdown
            isOpen={filterDropdownOpen}
            filterType={activeFilterType}
            filterSelections={filterSelections}
            onSelectionChange={setFilterSelections}
            onClose={() => {
              setFilterDropdownOpen(false);
              setActiveFilterType(null);
              setFilterAnchorEl(null);
            }}
            anchorEl={filterAnchorEl}
          />

          {/* Chart Section */}
          <div className="forecast-chart bg-gray-50 rounded-lg shadow p-6">
            <Suspense fallback={
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-gray-500">Loading charts...</div>
              </div>
            }>
              {isLoadingForecast ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-gray-500">Loading forecast data...</div>
                </div>
              ) : forecastError ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-red-500">{forecastError}</div>
                </div>
              ) : forecastData ? (
                <ForecastCharts
                  forecastData={forecastData}
                  adjustmentValue={currentAdjustmentValue}
                />
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-gray-500">Select filters to view forecast data</div>
                </div>
              )}
            </Suspense>
          </div>


          {/* Adjustment History */}
          {historyError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              Error loading adjustment history: {historyError}
            </div>
          )}
          <AdjustmentHistory
            entries={adjustmentHistory}
            isLoading={isLoadingHistory}
            onToggleActive={toggleAdjustmentActive}
            onDelete={deleteAdjustment}
            showAllUsers={showAllUsers}
            onToggleShowAllUsers={setShowAllUsers}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <>
          {historyError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              Error loading adjustment history: {historyError}
            </div>
          )}
          <AdjustmentHistory
            entries={adjustmentHistory}
            isLoading={isLoadingHistory}
            onToggleActive={toggleAdjustmentActive}
            onDelete={deleteAdjustment}
            showAllUsers={showAllUsers}
            onToggleShowAllUsers={setShowAllUsers}
          />
        </>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Cache Performance</h2>
          <CacheStatus />
        </div>
      )}

      {/* Debug panel for troubleshooting */}
      {process.env.NODE_ENV === 'development' && <AdjustmentDebugPanel />}
    </DashboardLayout>
  );
}
