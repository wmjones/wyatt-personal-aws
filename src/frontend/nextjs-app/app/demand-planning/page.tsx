'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import ForecastCharts from './components/ForecastCharts';
import AdjustmentPanel from './components/AdjustmentPanel';
import AdjustmentHistoryTable from './components/AdjustmentHistoryTable';
import { FilterSelections } from './components/FilterSidebar';
import { HierarchySelection, TimePeriod } from '@/app/types/demand-planning';
import useForecast from './hooks/useForecast';
import useAdjustmentHistory from './hooks/useAdjustmentHistory';
import { AdjustmentData } from './components/AdjustmentModal';

export default function DemandPlanningPage() {
  // Filter selections state
  const [filterSelections, setFilterSelections] = useState<FilterSelections>({
    states: [],
    dmaIds: [],
    dcIds: []
  });

  // Keep hierarchy selections for backward compatibility with useForecast hook
  const [selectedHierarchies, setSelectedHierarchies] = useState<HierarchySelection[]>([]);
  // Initialize with all daily periods from Jan 1 to Apr 1, 2025
  const [selectedTimePeriods, setSelectedTimePeriods] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'forecast' | 'history' | 'settings'>('forecast');

  // Generate daily periods for the full range (matches useForecast hook)
  const timePeriods: TimePeriod[] = (() => {
    const periods: TimePeriod[] = [];
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-04-01');

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      periods.push({
        id: `day-${dateStr}`,
        name: currentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        startDate: dateStr,
        endDate: dateStr,
        type: 'day'
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return periods;
  })();

  // Initialize with some demo selections for visualization
  useEffect(() => {
    console.log("Setting initial hierarchy selections");
    setSelectedHierarchies([
      {
        type: 'geography',
        selectedNodes: ['region-1-1-1', 'region-1-1-2'] // NY, MA
      },
      {
        type: 'product',
        selectedNodes: ['category-1-1-1'] // Laptops
      }
    ]);

    // Select all daily periods for the full date range
    const allPeriodIds = timePeriods.map(period => period.id);
    setSelectedTimePeriods(allPeriodIds);
    console.log("Page component mount - setting all daily periods:", allPeriodIds.length);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch forecast data based on selections
  const {
    forecastData,
    isLoading: isLoadingForecast,
    error: forecastError,
    applyAdjustment,
    resetAdjustments,
    refreshForecast
  } = useForecast({
    hierarchySelections: selectedHierarchies,
    timePeriodIds: selectedTimePeriods,
    filterSelections
  });

  // Fetch adjustment history
  const {
    adjustmentHistory,
    isLoading: isLoadingHistory,
    // Error variable is available but not currently used in the UI
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error: historyError,
    refreshHistory
  } = useAdjustmentHistory();

  // Handle filter selection changes from sidebar
  const handleFilterSelectionChange = (selections: FilterSelections) => {
    setFilterSelections(selections);
    console.log("Filter selections changed:", selections);

    // You can add logic here to convert filter selections to hierarchy selections
    // if needed for backward compatibility with existing hooks
  };

  // Handle tab change
  const handleTabChange = (tab: 'forecast' | 'history' | 'settings') => {
    setActiveTab(tab);

    // If switching to history tab, refresh the history data
    if (tab === 'history') {
      refreshHistory();
    }
  };

  // Handle adjustment creation
  const handleApplyAdjustment = async (adjustment: AdjustmentData) => {
    await applyAdjustment(adjustment);

    // Refresh history after applying adjustment
    refreshHistory();
  };

  return (
    <DashboardLayout
      filterSelections={filterSelections}
      onFilterSelectionChange={handleFilterSelectionChange}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {activeTab === 'forecast' && (
        <div className="grid gap-6">
          {/* Forecast View */}
          <div className="bg-dp-surface-primary border border-dp-border-light rounded-lg shadow-dp-light mb-6">
            <div className="flex justify-between items-center p-5 border-b border-dp-border-light">
              <div>
                <h1 className="text-2xl font-medium text-dp-text-primary">Sales Forecast</h1>
                <p className="text-dp-text-secondary mt-1">
                  {selectedHierarchies.length > 0
                    ? `Viewing forecast data for ${selectedHierarchies.map(h => h.type).join(', ')}`
                    : 'Select hierarchies from the sidebar to view forecast data.'
                  }
                </p>
              </div>
            </div>

            {isLoadingForecast ? (
              <div className="bg-dp-background-tertiary rounded-lg p-4 h-80 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dp-cfa-red mb-4"></div>
                  <p className="text-dp-text-tertiary">Loading forecast data...</p>
                </div>
              </div>
            ) : forecastError ? (
              <div className="bg-red-50 text-red-700 rounded-lg p-4 flex items-center">
                <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{forecastError}</span>
              </div>
            ) : forecastData ? (
              <div className="p-4">
                <ForecastCharts
                  forecastData={forecastData}
                />
              </div>
            ) : (
              <div className="bg-dp-background-tertiary rounded-lg p-4 h-80 flex items-center justify-center">
                <p className="text-dp-text-tertiary">Select hierarchies to view forecast data</p>
              </div>
            )}
          </div>

          {/* Adjustment Panel */}
          {forecastData && (
            <div className="max-w-md">
              <AdjustmentPanel
                forecastData={forecastData}
                isLoading={isLoadingForecast}
                onApplyAdjustment={handleApplyAdjustment}
                onResetAdjustments={resetAdjustments}
                onRefreshForecast={refreshForecast}
                selectedHierarchies={selectedHierarchies}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="grid gap-6">
          {/* History View */}
          <AdjustmentHistoryTable
            entries={adjustmentHistory}
            isLoading={isLoadingHistory}
          />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="dp-card p-6">
          <h1 className="text-2xl font-light mb-4 text-dp-text-primary">Settings</h1>
          <p className="text-dp-text-secondary">
            Dashboard settings will be implemented in a future update.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
