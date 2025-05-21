'use client';

import { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  refreshData?: () => Promise<void>;
}

export default function Header({ refreshData }: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState('Q1 2025');

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

  return (
    <header className="bg-dp-surface-primary border-b border-dp-border-light h-[var(--dp-header-height)] px-4 flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/demand-planning" className="text-dp-text-brand font-semibold text-xl mr-8">
          Demand Planning
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <select
            className="dp-select pl-3 pr-10 py-1 text-sm"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
          >
            <option value="Q1 2025">Q1 2025</option>
            <option value="Q2 2025">Q2 2025</option>
            <option value="Q3 2025">Q3 2025</option>
            <option value="Q4 2025">Q4 2025</option>
            <option value="All 2025">All 2025</option>
          </select>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="dp-btn-tertiary px-3 py-1 text-sm flex items-center"
          aria-label="Refresh data"
        >
          {isRefreshing ? (
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh
        </button>

        <div className="relative">
          <button className="dp-btn-tertiary px-3 py-1 text-sm flex items-center">
            <span className="h-8 w-8 rounded-full bg-dp-cfa-red text-white flex items-center justify-center mr-2">JD</span>
            <span>John Doe</span>
            <svg className="h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
