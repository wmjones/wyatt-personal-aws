'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { FilterSelections } from './components/FilterSidebar';
import useForecast from './hooks/useForecast';
import CacheStatus from './components/CacheStatus';
import NewAdjustmentPanel from './components/NewAdjustmentPanel';
import AdjustmentHistory, { AdjustmentEntry } from './components/AdjustmentHistory';

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

  // Adjustment history state
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentEntry[]>([]);

  // Initialize without hardcoded selections
  useEffect(() => {
    console.log("Page component mount - users will select their own hierarchies and filters");
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
    console.log("DemandPlanningPage: Filter selections changed", newSelections);
    setFilterSelections(newSelections);
  };

  // Handle real-time adjustment changes
  const handleAdjustmentChange = (adjustmentValue: number) => {
    setCurrentAdjustmentValue(adjustmentValue);
  };

  // Handle saving adjustments
  const handleSaveAdjustment = async (adjustmentValue: number, filterContext: FilterSelections) => {
    try {
      // Get inventory item name for display
      const inventoryItemName = forecastData?.inventoryItems.find(
        item => item.id === filterContext.inventoryItemId
      )?.name;

      const response = await fetch('/api/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adjustmentValue,
          filterContext,
          inventoryItemName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save adjustment');
      }

      const result = await response.json();

      // Add the new adjustment to the history
      setAdjustmentHistory(prev => [result.adjustment, ...prev]);

      console.log('Adjustment saved successfully:', result);
    } catch (error) {
      console.error('Error saving adjustment:', error);
      throw error;
    }
  };

  // Load adjustment history on mount
  const loadAdjustmentHistory = async () => {
    try {
      const response = await fetch('/api/adjustments');
      if (response.ok) {
        const result = await response.json();
        setAdjustmentHistory(result.adjustments);
      }
    } catch (error) {
      console.error('Error loading adjustment history:', error);
    }
  };

  useEffect(() => {
    loadAdjustmentHistory();
  }, []);


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
          {forecastData && (
            <NewAdjustmentPanel
              forecastData={forecastData}
              filterSelections={filterSelections}
              onAdjustmentChange={handleAdjustmentChange}
              onSaveAdjustment={handleSaveAdjustment}
            />
          )}

          {/* Adjustment History */}
          <AdjustmentHistory entries={adjustmentHistory} />
        </div>
      )}

      {activeTab === 'history' && (
        <AdjustmentHistory entries={adjustmentHistory} />
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
