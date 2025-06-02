'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useOnboarding } from './hooks/useOnboarding';
import WelcomeModal from './WelcomeModal';
import ProductTour from './ProductTour';
import HelpButton from './HelpButton';
import { TourStep } from './hooks/useTourProgress';

interface OnboardingManagerProps {
  children: React.ReactNode;
}

// Define tour steps for different pages
const dashboardTourSteps: TourStep[] = [
  {
    id: 'dashboard-welcome',
    title: 'Welcome to Your Dashboard',
    content: 'This is your central hub for viewing and managing demand forecasts. Let me show you around!',
    placement: 'center',
    showPrev: false
  },
  {
    id: 'dashboard-stats',
    title: 'Key Metrics',
    content: 'These cards show your most important metrics at a glance. Click any card to dive deeper.',
    target: '.dashboard-stats',
    placement: 'bottom'
  },
  {
    id: 'dashboard-nav',
    title: 'Navigation',
    content: 'Use the navigation menu to access different features like Demand Planning and Reports.',
    target: '.main-navigation',
    placement: 'right'
  },
  {
    id: 'dashboard-complete',
    title: 'Ready to Explore!',
    content: 'You\'re all set! Head to the Demand Planning page to start working with forecasts.',
    placement: 'center',
    showSkip: false
  }
];

const demandPlanningTourSteps: TourStep[] = [
  {
    id: 'demand-welcome',
    title: 'Demand Planning Overview',
    content: 'This is where you can view, analyze, and adjust your demand forecasts in real-time.',
    placement: 'center',
    showPrev: false
  },
  {
    id: 'demand-filters',
    title: 'Filter Your Data',
    content: 'Use these filters to narrow down your view. Try selecting a specific state or date range.',
    target: '.filter-sidebar',
    placement: 'right',
    canClickTarget: true
  },
  {
    id: 'demand-chart',
    title: 'Interactive Charts',
    content: 'Your forecast data is displayed here. Hover over data points for details, or click to make adjustments.',
    target: '.forecast-chart',
    placement: 'top'
  },
  {
    id: 'demand-adjustments',
    title: 'Make Adjustments',
    content: 'Click the "New Adjustment" button to modify forecasts. Changes are reflected immediately.',
    target: '.new-adjustment-button',
    placement: 'left',
    canClickTarget: true
  },
  {
    id: 'demand-complete',
    title: 'You\'re Ready!',
    content: 'Great job! You now know the basics. Try making your first adjustment to see the system in action.',
    placement: 'center',
    showSkip: false
  }
];

export default function OnboardingManager({ children }: OnboardingManagerProps) {
  const pathname = usePathname();
  const { shouldShowWelcome, shouldShowTour, preferences } = useOnboarding();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showProductTour, setShowProductTour] = useState(false);
  const [currentTourSteps, setCurrentTourSteps] = useState<TourStep[]>([]);

  // Show welcome modal for first-time users
  useEffect(() => {
    if (shouldShowWelcome && !showProductTour) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowWelcome, showProductTour]);

  // Determine which tour to show based on current page
  useEffect(() => {
    if (!shouldShowTour || showWelcomeModal) return;

    // Check if user has completed the tour for the current page
    const hasCompletedDashboardTour = preferences?.tour_progress?.['dashboard-complete'] === true;
    const hasCompletedDemandTour = preferences?.tour_progress?.['demand-complete'] === true;

    if (pathname === '/dashboard' && !hasCompletedDashboardTour) {
      setCurrentTourSteps(dashboardTourSteps);
      setShowProductTour(true);
    } else if (pathname === '/demand-planning' && !hasCompletedDemandTour) {
      setCurrentTourSteps(demandPlanningTourSteps);
      setShowProductTour(true);
    }
  }, [pathname, shouldShowTour, showWelcomeModal, preferences]);

  const handleStartTour = () => {
    setShowWelcomeModal(false);
    // Tour will start automatically based on the current page
  };

  const handleTourComplete = () => {
    setShowProductTour(false);
  };

  const handleTourSkip = () => {
    setShowProductTour(false);
  };

  // Get the tour steps for the current page
  const getCurrentPageTourSteps = () => {
    if (pathname === '/dashboard') return dashboardTourSteps;
    if (pathname === '/demand-planning') return demandPlanningTourSteps;
    return [];
  };

  return (
    <>
      {children}

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onStartTour={handleStartTour}
      />

      {/* Product Tour */}
      {currentTourSteps.length > 0 && (
        <ProductTour
          steps={currentTourSteps}
          isActive={showProductTour}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}

      {/* Help Button - Always visible for logged in users */}
      {preferences && (
        <HelpButton tourSteps={getCurrentPageTourSteps()} />
      )}
    </>
  );
}
