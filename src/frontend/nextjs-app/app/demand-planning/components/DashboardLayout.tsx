'use client';

import { memo, useCallback } from 'react';
import DemandPlanningHeader from './DemandPlanningHeader';
import FilterSidebar, { FilterSelections } from './FilterSidebar';
import IntegratedControlPanel from './IntegratedControlPanel';
import { ForecastSeries } from '@/app/types/demand-planning';
import { ErrorBoundary } from '../../components/error-boundary';

// Dashboard view type
type DashboardView = 'forecast' | 'history' | 'settings';

interface DashboardLayoutProps {
  children: React.ReactNode;
  filterSelections: FilterSelections;
  onFilterSelectionChange?: (selections: FilterSelections) => void;
  activeTab: DashboardView;
  onTabChange: (tab: DashboardView) => void;
  // New props for integrated control panel
  forecastData?: ForecastSeries | null;
  currentAdjustmentValue?: number;
  onAdjustmentChange?: (adjustmentValue: number) => void;
  onSaveAdjustment?: (adjustmentValue: number, filterContext: FilterSelections) => Promise<void>;
  useIntegratedPanel?: boolean; // Flag to enable new integrated panel
  historyFeedContent?: React.ReactNode; // Content for the history feed area
}

const DashboardLayout = memo(function DashboardLayout({
  children,
  filterSelections,
  onFilterSelectionChange,
  activeTab,
  onTabChange,
  forecastData,
  currentAdjustmentValue = 0,
  onAdjustmentChange,
  onSaveAdjustment,
  useIntegratedPanel = true, // Default to true to use the new integrated panel
  historyFeedContent
}: DashboardLayoutProps) {
  const handleFilterSelectionChange = useCallback((selections: FilterSelections) => {
    // Pass the selections up to the parent component if the callback is provided
    if (onFilterSelectionChange) {
      onFilterSelectionChange(selections);
    }
  }, [onFilterSelectionChange]);

  // Mock refresh data function that would be implemented in a real application
  const refreshData = async () => {
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real application, this would fetch fresh data
    console.log('Data refreshed');
  };

  return (
    <div className="min-h-screen min-w-[1280px] flex flex-col bg-dp-background-primary">
      {/* Header Bar - Fixed 64px height */}
      <DemandPlanningHeader
        refreshData={refreshData}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* Main Layout Grid - Desktop only */}
      <div className="flex-1 grid grid-cols-[var(--dp-sidebar-width)_1fr] grid-rows-[1fr_var(--dp-history-feed-height)] h-[calc(100vh-var(--dp-header-height))]">
        {/* Sidebar - Fixed 320px width */}
        <div className="row-span-1 bg-dp-surface-secondary border-r border-dp-frame-border overflow-y-auto">
          {useIntegratedPanel && onAdjustmentChange && onSaveAdjustment ? (
            <ErrorBoundary
              resetKeys={[
                JSON.stringify(filterSelections),
                currentAdjustmentValue,
                forecastData?.baseline?.length || 0
              ]}
              onError={(error, errorInfo) => {
                console.error('IntegratedControlPanel Error:', error, errorInfo);
              }}
            >
              <IntegratedControlPanel
                filterSelections={filterSelections}
                onFilterSelectionChange={handleFilterSelectionChange}
                forecastData={forecastData}
                currentAdjustmentValue={currentAdjustmentValue}
                onAdjustmentChange={onAdjustmentChange}
                onSaveAdjustment={onSaveAdjustment}
              />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary
              resetKeys={[JSON.stringify(filterSelections)]}
              onError={(error, errorInfo) => {
                console.error('FilterSidebar Error:', error, errorInfo);
              }}
            >
              <FilterSidebar
                selections={filterSelections}
                onSelectionChange={handleFilterSelectionChange}
                onAdjustmentChange={onAdjustmentChange}
                onSaveAdjustment={onSaveAdjustment}
                showAdjustmentPanel={true}
              />
            </ErrorBoundary>
          )}
        </div>

        {/* Main Content Area - Fluid width */}
        <main className="bg-dp-background-primary p-8 overflow-auto">
          {children}
        </main>

        {/* History Feed - Fixed 240px height, spans full width */}
        <div className="col-span-2 bg-dp-background-secondary border-t border-dp-frame-border p-6 overflow-x-auto">
          {historyFeedContent}
        </div>
      </div>
    </div>
  );
});

export default DashboardLayout;
