'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import ForecastCharts from './components/ForecastCharts';
import AdjustmentPanel from './components/AdjustmentPanel';
import AdjustmentHistoryTable from './components/AdjustmentHistoryTable';
import { HierarchySelection, HierarchyType, TimePeriod } from '@/app/types/demand-planning';
import useForecast from './hooks/useForecast';
import useAdjustmentHistory from './hooks/useAdjustmentHistory';
import { AdjustmentData } from './components/AdjustmentModal';

export default function DemandPlanningPage() {
  const [selectedHierarchies, setSelectedHierarchies] = useState<HierarchySelection[]>([]);
  const [selectedTimePeriods, setSelectedTimePeriods] = useState<string[]>(['Q1-2025', 'Q2-2025', 'Q3-2025', 'Q4-2025']);
  const [activeTab, setActiveTab] = useState<'forecast' | 'history' | 'settings'>('forecast');

  // Demo time periods
  const timePeriods: TimePeriod[] = [
    { id: 'Q1-2025', name: 'Q1 2025', startDate: '2025-01-01', endDate: '2025-03-31', type: 'quarter' },
    { id: 'Q2-2025', name: 'Q2 2025', startDate: '2025-04-01', endDate: '2025-06-30', type: 'quarter' },
    { id: 'Q3-2025', name: 'Q3 2025', startDate: '2025-07-01', endDate: '2025-09-30', type: 'quarter' },
    { id: 'Q4-2025', name: 'Q4 2025', startDate: '2025-10-01', endDate: '2025-12-31', type: 'quarter' },
  ];

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

    console.log("Page component mount - initial time periods:", selectedTimePeriods);
  }, [selectedTimePeriods]);

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
    timePeriodIds: selectedTimePeriods
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

  // Handle hierarchy selection changes from sidebar
  const handleHierarchySelectionChange = (selection: { type: HierarchyType; nodeIds: string[] }) => {
    setSelectedHierarchies(prev => {
      // Remove the existing selection for this type
      const updatedSelections = prev.filter(s => s.type !== selection.type);

      // Add the new selection if there are nodes selected
      if (selection.nodeIds.length > 0) {
        updatedSelections.push({
          type: selection.type,
          selectedNodes: selection.nodeIds
        });
      }

      return updatedSelections;
    });
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
      onHierarchySelectionChange={handleHierarchySelectionChange}
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
              <div className="hidden md:block">
                <button className="dp-btn-tertiary px-4 py-2 text-sm">
                  <svg className="inline-block w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Add New Forecast
                </button>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Adjustment Panel */}
            {forecastData && (
              <div className="md:col-span-1">
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

            {/* Time Period Selection */}
            <div className="md:col-span-1">
              <div className="bg-dp-surface-primary p-4 shadow-dp-light border border-dp-border-light rounded-lg">
                <h2 className="text-lg font-medium mb-4 text-dp-text-primary border-b border-dp-border-light pb-2">Time Periods</h2>
                <div className="space-y-2">
                  {timePeriods.map(period => (
                    <label key={period.id} className="flex items-center">
                      <input
                        type="checkbox"
                        name={`time-period-${period.id}`}
                        id={`time-period-${period.id}`}
                        checked={selectedTimePeriods.includes(period.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedTimePeriods(prev => [...prev, period.id]);
                          } else {
                            setSelectedTimePeriods(prev => prev.filter(id => id !== period.id));
                          }
                        }}
                        className="form-checkbox text-dp-cfa-red rounded border-dp-border-medium h-4 w-4 mr-2"
                      />
                      <span className="text-sm text-dp-text-primary">{period.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Hierarchies */}
            <div className="md:col-span-1">
              <div className="bg-dp-surface-primary p-4 shadow-dp-light border border-dp-border-light rounded-lg">
                <h2 className="text-lg font-medium mb-4 text-dp-text-primary border-b border-dp-border-light pb-2">Selected Hierarchies</h2>
                {selectedHierarchies.length > 0 ? (
                  <div className="space-y-3">
                    {selectedHierarchies.map(selection => (
                      <div key={selection.type} className="pb-2 border-b border-dp-border-light last:border-0">
                        <p className="text-sm font-medium capitalize text-dp-text-primary">{selection.type}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selection.selectedNodes.map(node => (
                            <span key={node} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dp-background-tertiary text-dp-text-primary border border-dp-border-light">
                              {node.split('-').pop()}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dp-text-secondary">
                    No hierarchies selected. Use the sidebar to select hierarchies.
                  </p>
                )}
              </div>
            </div>
          </div>
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
