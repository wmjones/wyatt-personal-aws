'use client';

import { useState } from 'react';
import { DashboardView } from '@/app/types/demand-planning';

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
    <header className="bg-dp-surface-primary border-b border-dp-border-light h-[var(--dp-header-height)] flex flex-col justify-center">
      <div className="flex items-center justify-between px-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-medium text-dp-text-primary">Forecasting</h1>
        </div>

        <div className="flex items-center">
          <button
            className="px-3 py-1.5 text-sm font-medium text-dp-text-secondary border border-dp-border-light rounded-md hover:bg-dp-background-tertiary transition-colors ml-4"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            Revert Edits
          </button>
        </div>
      </div>

      <nav className="border-t border-dp-border-light mt-2">
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
