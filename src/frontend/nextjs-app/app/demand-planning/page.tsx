'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { FilterSelections } from './components/FilterSidebar';
import useForecast from './hooks/useForecast';
import CacheStatus from './components/CacheStatus';
import NewAdjustmentPanel from './components/NewAdjustmentPanel';
import AdjustmentHistory from './components/AdjustmentHistory';
import useAdjustmentHistory from './hooks/useAdjustmentHistory';

// Lazy load the heavy chart component
const ForecastCharts = lazy(() => import('./components/ForecastCharts'));

export default function DemandPlanningPage() {
  // Filter selections state
  const [filterSelections, setFilterSelections] = useState<FilterSelections>({
    states: [],
    dmaIds: [],
    dcIds: [],
    inventoryItemId: null,
    dateRange: { startDate: null, endDate: null }
  });

  const [activeTab, setActiveTab] = useState<'forecast' | 'history' | 'settings'>('forecast');

  // Real-time adjustment state
  const [currentAdjustmentValue, setCurrentAdjustmentValue] = useState(0);
  const [showNewAdjustment, setShowNewAdjustment] = useState(false);

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

  // Initialize without hardcoded selections
  useEffect(() => {
    // Page component mount - users will select their own hierarchies and filters
  }, []);

  // Fetch forecast data using TanStack Query
  const {
    forecastData,
    isLoading: isLoadingForecast,
    error: forecastError
  } = useForecast({
    filterSelections,
  });

  // Handle filter changes from FilterSidebar
  const handleFilterChange = (newSelections: FilterSelections) => {
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
  };

  // Remove the manual loading as it's handled by the hook


  // Calculate available periods based on forecast data (removed - not used)
  // const availablePeriods = forecastData?.timePeriods || [];

  return (
    <DashboardLayout
      filterSelections={filterSelections}
      onFilterSelectionChange={handleFilterChange}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* Main content area based on active tab */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Forecast Overview</h2>
            <button
              className="new-adjustment-button px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              onClick={() => setShowNewAdjustment(!showNewAdjustment)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Adjustment
            </button>
          </div>

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

          {/* New Adjustment Panel */}
          {forecastData && showNewAdjustment && (
            <NewAdjustmentPanel
              forecastData={forecastData}
              filterSelections={filterSelections}
              onAdjustmentChange={handleAdjustmentChange}
              onSaveAdjustment={handleSaveAdjustment}
            />
          )}

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
    </DashboardLayout>
  );
}
