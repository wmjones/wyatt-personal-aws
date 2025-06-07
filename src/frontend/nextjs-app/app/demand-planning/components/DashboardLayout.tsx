'use client';

import { useState, memo, useCallback } from 'react';
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
  useIntegratedPanel = true // Default to true to use the new integrated panel
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleFilterSelectionChange = useCallback((selections: FilterSelections) => {
    // Pass the selections up to the parent component if the callback is provided
    if (onFilterSelectionChange) {
      onFilterSelectionChange(selections);
    }
  }, [onFilterSelectionChange]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  // Mock refresh data function that would be implemented in a real application
  const refreshData = async () => {
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real application, this would fetch fresh data
    console.log('Data refreshed');
  };

  return (
    <div className="min-h-screen flex flex-col bg-dp-background-primary">
      <DemandPlanningHeader
        refreshData={refreshData}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      <div className="flex flex-1">
        {/* Mobile sidebar toggle */}
        <div className="md:hidden fixed bottom-4 left-4 z-10">
          <button
            onClick={toggleSidebar}
            className="dp-btn dp-btn-primary h-12 w-12 rounded-full flex items-center justify-center"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6"
            >
              {sidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Sidebar */}
        <div
          className={`fixed md:relative z-20 md:z-auto w-[var(--dp-sidebar-width)] h-[calc(100vh-var(--dp-header-height))] transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
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
              />
            </ErrorBoundary>
          )}
        </div>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className={`flex-1 flex flex-col ${sidebarOpen ? 'md:ml-[var(--dp-sidebar-width)]' : ''}`}>
          <main className="flex-1 px-6 py-5 overflow-auto bg-dp-background-primary">
            {children}
          </main>
        </div>
      </div>

    </div>
  );
});

export default DashboardLayout;
