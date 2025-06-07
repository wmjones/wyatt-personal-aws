'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { FilterSelections } from './components/FilterSidebar';
import useForecast from './hooks/useForecast';
import CacheStatus from './components/CacheStatus';
import AdjustmentHistory from './components/AdjustmentHistory';
import useAdjustmentHistory from './hooks/useAdjustmentHistory';
import AdjustmentDebugPanel from './components/AdjustmentDebugPanel';
import { postgresForecastService } from '@/app/services/postgresForecastService';

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

  // Auto-select first inventory item if none selected
  useEffect(() => {
    const autoSelectFirstInventoryItem = async () => {
      if (!filterSelections.inventoryItemId) {
        try {
          const inventoryItems = await postgresForecastService.getDistinctInventoryItems();
          if (inventoryItems.length > 0) {
            const firstItem = inventoryItems[0].toString();
            console.log(`Auto-selecting first inventory item: ${firstItem}`);
            setFilterSelections(prev => ({
              ...prev,
              inventoryItemId: firstItem,
              // Also set default date range if not set
              dateRange: prev.dateRange.startDate && prev.dateRange.endDate
                ? prev.dateRange
                : { startDate: '2025-01-01', endDate: '2025-03-31' }
            }));
          }
        } catch (error) {
          console.error('Failed to fetch first inventory item:', error);
        }
      }
    };

    autoSelectFirstInventoryItem();
  }, []); // Only run once on mount to avoid infinite loops

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
      forecastData={forecastData}
      currentAdjustmentValue={currentAdjustmentValue}
      onAdjustmentChange={handleAdjustmentChange}
      onSaveAdjustment={handleSaveAdjustment}
      useIntegratedPanel={true}
    >
      {/* Main content area based on active tab */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Forecast Overview</h2>
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
