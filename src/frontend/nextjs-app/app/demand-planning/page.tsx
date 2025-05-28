'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import DashboardLayout from './components/DashboardLayout';
import AdjustmentPanel from './components/AdjustmentPanel';
import AdjustmentHistoryTable from './components/AdjustmentHistoryTable';
import { FilterSelections } from './components/FilterSidebar';
import useForecast from './hooks/useForecast';
import useAdjustmentHistory from './hooks/useAdjustmentHistory';
import { AdjustmentData } from './components/AdjustmentModal';
import CacheStatus from './components/CacheStatus';

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

  // Initialize without hardcoded selections
  useEffect(() => {
    console.log("Page component mount - users will select their own hierarchies and filters");
  }, []);

  // Fetch forecast data using TanStack Query
  const {
    forecastData,
    isLoading: isLoadingForecast,
    error: forecastError,
    applyAdjustment,
    refetch,
  } = useForecast({
    filterSelections,
  });

  // Fetch adjustment history
  const {
    adjustmentHistory,
    isLoading: isLoadingHistory,
    error: historyError,
    refreshHistory,
  } = useAdjustmentHistory();

  // Handle filter changes from FilterSidebar
  const handleFilterChange = (newSelections: FilterSelections) => {
    console.log("DemandPlanningPage: Filter selections changed", newSelections);
    setFilterSelections(newSelections);
  };

  // Handle adjustment application
  const handleApplyAdjustment = async (adjustmentData: AdjustmentData) => {
    console.log("Applying adjustment:", adjustmentData);
    try {
      await applyAdjustment(adjustmentData);
      console.log("Adjustment applied successfully");

      // Refetch adjustment history to show the new adjustment
      await refreshHistory();
    } catch (error) {
      console.error("Failed to apply adjustment:", error);
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
    >
      {/* Main content area based on active tab */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* Chart Section */}
          <div className="bg-gray-50 rounded-lg shadow p-6">
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
                <ForecastCharts forecastData={forecastData} />
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-gray-500">Select filters to view forecast data</div>
                </div>
              )}
            </Suspense>
          </div>

          {/* Adjustment Panel */}
          {forecastData && (
            <AdjustmentPanel
              forecastData={forecastData}
              isLoading={isLoadingForecast}
              onApplyAdjustment={handleApplyAdjustment}
              onResetAdjustments={async () => {
                console.log("Reset adjustments not implemented");
              }}
              onRefreshForecast={async () => {
                await refetch();
              }}
            />
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {historyError && (
            <div className="p-4 text-red-500">{historyError}</div>
          )}
          <AdjustmentHistoryTable
            entries={adjustmentHistory}
            isLoading={isLoadingHistory}
          />
        </div>
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
