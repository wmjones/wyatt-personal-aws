'use client';

import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import HierarchySidebar from './HierarchySidebar';
import TabNavigation from './TabNavigation';
import { DashboardView, HierarchyType } from '@/app/types/demand-planning';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onHierarchySelectionChange?: (selection: { type: HierarchyType; nodeIds: string[] }) => void;
  activeTab: DashboardView;
  onTabChange: (tab: DashboardView) => void;
}

export default function DashboardLayout({
  children,
  onHierarchySelectionChange,
  activeTab,
  onTabChange
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleHierarchySelectionChange = (selection: { type: HierarchyType; nodeIds: string[] }) => {
    // Pass the selection up to the parent component if the callback is provided
    if (onHierarchySelectionChange) {
      onHierarchySelectionChange(selection);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Mock refresh data function that would be implemented in a real application
  const refreshData = async () => {
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real application, this would fetch fresh data
    console.log('Data refreshed');
  };

  return (
    <div className="min-h-screen flex flex-col bg-dp-background-primary">
      <Header refreshData={refreshData} />

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
          className={`fixed md:relative z-20 md:z-auto w-[var(--dp-sidebar-width)] h-[calc(100vh-var(--dp-header-height)-var(--dp-footer-height))] transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <HierarchySidebar onSelectionChange={handleHierarchySelectionChange} />
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
          <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />

          <main className="flex-1 px-6 py-5 overflow-auto bg-dp-background-primary">
            {children}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
