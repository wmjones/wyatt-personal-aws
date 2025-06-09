'use client';

import { useOnboarding } from './hooks/useOnboarding';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';

export default function OnboardingProgress() {
  const { preferences } = useOnboarding();

  if (!preferences || preferences.has_completed_tour) {
    return null;
  }

  const steps = [
    { id: 'welcome', label: 'Welcome', completed: preferences.has_seen_welcome },
    { id: 'dashboard-tour', label: 'Dashboard Tour', completed: preferences.tour_progress?.['dashboard-complete'] === true },
    { id: 'demand-planning-tour', label: 'Demand Planning Tour', completed: preferences.tour_progress?.['demand-complete'] === true },
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-indigo-900 mb-2">
            Getting Started Progress
          </h3>
          <div className="flex items-center gap-4 mb-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Circle className="w-5 h-5 text-indigo-300" />
                )}
                <span className={`ml-2 text-sm ${step.completed ? 'text-indigo-900' : 'text-indigo-600'}`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 ml-4 ${
                    step.completed ? 'bg-indigo-600' : 'bg-indigo-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => {
            // Navigate to the next uncompleted step
            if (!preferences.has_seen_welcome) {
              window.location.reload(); // Trigger welcome modal
            } else if (!preferences.tour_progress?.['demand-complete']) {
              window.location.href = '/demand-planning';
            }
          }}
          className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          <PlayCircle className="w-4 h-4" />
          Continue Tour
        </button>
      </div>
    </div>
  );
}
