'use client';

import { useState } from 'react';
import { HelpCircle, RefreshCw, BookOpen, MessageCircle } from 'lucide-react';
import { useOnboarding } from './hooks/useOnboarding';
import ProductTour from './ProductTour';
import { TourStep } from './hooks/useTourProgress';

interface HelpButtonProps {
  tourSteps?: TourStep[];
}

export default function HelpButton({ tourSteps = [] }: HelpButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const { resetOnboarding, preferences } = useOnboarding();

  const handleRestartTour = () => {
    setShowMenu(false);
    setShowTour(true);
  };

  const handleResetOnboarding = async () => {
    await resetOnboarding();
    setShowMenu(false);
    // Reload the page to trigger the welcome modal
    window.location.reload();
  };

  return (
    <>
      {/* Help Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center group"
          aria-label="Help menu"
        >
          <HelpCircle className="w-6 h-6" />
          <span className="absolute right-full mr-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Need help?
          </span>
        </button>

        {/* Help Menu */}
        {showMenu && (
          <div className="absolute bottom-16 right-0 w-64 bg-white rounded-lg shadow-xl p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Help & Resources</h3>

            {tourSteps.length > 0 && (
              <button
                onClick={handleRestartTour}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Restart Tour</p>
                  <p className="text-xs text-gray-600">View the feature tour again</p>
                </div>
              </button>
            )}

            <button
              onClick={handleResetOnboarding}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
            >
              <BookOpen className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Reset Onboarding</p>
                <p className="text-xs text-gray-600">Start from the beginning</p>
              </div>
            </button>

            <a
              href="/docs"
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
            >
              <BookOpen className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Documentation</p>
                <p className="text-xs text-gray-600">Read the user guide</p>
              </div>
            </a>

            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Contact Support</p>
                <p className="text-xs text-gray-600">Get help from our team</p>
              </div>
            </button>

            {/* Tooltips Toggle */}
            <div className="pt-2 border-t">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Show tooltips</span>
                <input
                  type="checkbox"
                  checked={preferences?.tooltips_enabled ?? true}
                  onChange={() => {/* TODO: Implement tooltip toggle */}}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Product Tour */}
      {tourSteps.length > 0 && (
        <ProductTour
          steps={tourSteps}
          isActive={showTour}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}
    </>
  );
}
