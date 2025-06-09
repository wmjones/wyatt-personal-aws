import { useState, useCallback, useMemo } from 'react';
import { useOnboarding } from './useOnboarding';

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for the target element
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'next' | 'complete' | 'custom';
  onNext?: () => void | Promise<void>;
  onPrev?: () => void | Promise<void>;
  canClickTarget?: boolean; // Allow clicking on the highlighted element
  showSkip?: boolean;
  showPrev?: boolean;
}

interface UseTourProgressReturn {
  currentStep: number;
  currentStepData: TourStep | null;
  totalSteps: number;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  goToStep: (stepIndex: number) => void;
  nextStep: () => Promise<void>;
  prevStep: () => Promise<void>;
  skipTour: () => Promise<void>;
  completeTour: () => Promise<void>;
  restartTour: () => void;
  isStepCompleted: (stepId: string) => boolean;
}

export function useTourProgress(steps: TourStep[]): UseTourProgressReturn {
  const [currentStep, setCurrentStep] = useState(0);
  const { preferences, updateTourProgress, markTourCompleted } = useOnboarding();

  // Calculate which step to start from based on progress
  const startingStep = useMemo(() => {
    if (!preferences?.tour_progress) return 0;

    // Find the last completed step
    let lastCompletedIndex = -1;
    steps.forEach((step, index) => {
      if (preferences.tour_progress[step.id]) {
        lastCompletedIndex = index;
      }
    });

    // Start from the next uncompleted step
    return Math.min(lastCompletedIndex + 1, steps.length - 1);
  }, [preferences?.tour_progress, steps]);

  // Set initial step based on progress
  useState(() => {
    setCurrentStep(startingStep);
  });

  const currentStepData = steps[currentStep] || null;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const completeTour = useCallback(async () => {
    await markTourCompleted();
  }, [markTourCompleted]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStep(stepIndex);
    }
  }, [totalSteps]);

  const nextStep = useCallback(async () => {
    if (currentStepData) {
      // Mark current step as completed
      await updateTourProgress(currentStepData.id, true);

      // Execute custom onNext handler if provided
      if (currentStepData.onNext) {
        await currentStepData.onNext();
      }

      if (isLastStep) {
        await completeTour();
      } else {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
      }
    }
  }, [currentStepData, isLastStep, totalSteps, updateTourProgress, completeTour]);

  const prevStep = useCallback(async () => {
    if (currentStepData?.onPrev) {
      await currentStepData.onPrev();
    }
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, [currentStepData]);

  const skipTour = useCallback(async () => {
    // Mark all remaining steps as skipped (not completed)
    const remainingSteps = steps.slice(currentStep);
    for (const step of remainingSteps) {
      await updateTourProgress(step.id, false);
    }

    // Don't mark tour as completed when skipping
    setCurrentStep(totalSteps - 1);
  }, [currentStep, steps, totalSteps, updateTourProgress]);

  const restartTour = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const isStepCompleted = useCallback((stepId: string): boolean => {
    return preferences?.tour_progress?.[stepId] === true;
  }, [preferences?.tour_progress]);

  return {
    currentStep,
    currentStepData,
    totalSteps,
    progress,
    isFirstStep,
    isLastStep,
    goToStep,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    restartTour,
    isStepCompleted
  };
}
