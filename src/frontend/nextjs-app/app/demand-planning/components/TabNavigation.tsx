'use client';

import { DashboardView } from '@/app/types/demand-planning';

interface TabNavigationProps {
  activeTab: DashboardView;
  onTabChange: (tab: DashboardView) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  // Tab names to match forecasting reference image exactly
  const tabs: { id: DashboardView; label: string }[] = [
    { id: 'forecast', label: 'Sales' },
    { id: 'history', label: 'Transactions' },
    { id: 'settings', label: 'Items' }
  ];

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-medium text-dp-text-primary px-1 mb-4">Forecasting</h1>
      <nav className="border-b border-dp-border-light bg-dp-surface-primary">
        <div className="flex h-[var(--dp-tab-height)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-8 text-sm font-medium relative flex items-center justify-center ${
                activeTab === tab.id
                  ? 'text-dp-cfa-red'
                  : 'text-dp-text-secondary hover:text-dp-text-primary'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}

              {/* Red underline indicator exactly matching reference image */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-dp-cfa-red"></div>
              )}
            </button>
          ))}

          {/* This empty flex-grow div pushes everything to the left, matching reference image */}
          <div className="flex-grow"></div>
        </div>
      </nav>
    </div>
  );
}
