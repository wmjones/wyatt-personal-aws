'use client';

import { useState } from 'react';
// Dashboard view type
type DashboardView = 'forecast' | 'history' | 'settings';

interface HeaderProps {
  refreshData?: () => Promise<void>;
  activeTab?: DashboardView;
  onTabChange?: (tab: DashboardView) => void;
}

export default function Header({ refreshData, activeTab = 'forecast', onTabChange }: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tab names to match forecasting reference image exactly
  const tabs: { id: DashboardView; label: string }[] = [
    { id: 'forecast', label: 'Sales' },
    { id: 'history', label: 'Transactions' },
    { id: 'settings', label: 'Items' }
  ];

  const handleRefresh = async () => {
    if (refreshData && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await refreshData();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleTabChange = (tab: DashboardView) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <header className="bg-white border-b border-dp-frame-border h-[var(--dp-header-height)] flex flex-col justify-center">
      <div className="flex items-center justify-end px-6">
        <div className="flex items-center">
          <button
            className="h-10 px-6 text-body font-medium text-dp-text-secondary bg-white border border-dp-frame-border rounded-sm hover:bg-dp-background-secondary hover:border-dp-border-medium transition-all min-w-[120px] flex items-center justify-center gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Refreshing...</span>
              </>
            ) : (
              'Revert Edits'
            )}
          </button>
        </div>
      </div>

      <nav className="border-t border-gray-200 mt-2">
        <div className="flex h-[var(--dp-tab-height)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-6 text-sm font-medium relative flex items-center justify-center ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-dp-text-secondary hover:text-dp-text-primary'
              }`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}

              {/* Red underline indicator to match reference image */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary"></div>
              )}
            </button>
          ))}

          {/* This empty flex-grow div pushes everything to the left, matching reference image */}
          <div className="flex-grow"></div>
        </div>
      </nav>
    </header>
  );
}
