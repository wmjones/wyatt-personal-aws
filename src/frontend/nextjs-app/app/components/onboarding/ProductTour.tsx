'use client';

import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import type { Tour } from 'shepherd.js';
import { useTourProgress, TourStep } from './hooks/useTourProgress';
import 'shepherd.js/dist/css/shepherd.css';

interface ProductTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function ProductTour({
  steps,
  isActive,
  onComplete,
  onSkip
}: ProductTourProps) {
  const tourRef = useRef<Tour | null>(null);
  const {
    currentStep,
    nextStep,
    prevStep,
    skipTour
  } = useTourProgress(steps);

  // Initialize tour
  useEffect(() => {
    if (!tourRef.current) {
      tourRef.current = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: {
            enabled: true
          },
          scrollTo: {
            behavior: 'smooth',
            block: 'center'
          },
          modalOverlayOpeningRadius: 4,
          modalOverlayOpeningPadding: 4
        }
      });

      // Convert our steps to Shepherd steps
      steps.forEach((step, index) => {
        tourRef.current!.addStep({
          id: step.id,
          title: step.title,
          text: step.content,
          attachTo: step.target && step.placement !== 'center' ? {
            element: step.target,
            on: step.placement || 'bottom'
          } : undefined,
          canClickTarget: step.canClickTarget ?? false,
          buttons: [
            ...(step.showPrev !== false && index > 0 ? [{
              text: 'Back',
              action: () => {
                prevStep();
              },
              classes: 'shepherd-button-secondary'
            }] : []),
            ...(step.showSkip !== false ? [{
              text: 'Skip Tour',
              action: async () => {
                await skipTour();
                tourRef.current?.cancel();
                onSkip();
              },
              classes: 'shepherd-button-secondary'
            }] : []),
            {
              text: index === steps.length - 1 ? 'Complete' : 'Next',
              action: async () => {
                if (index === steps.length - 1) {
                  await nextStep();
                  tourRef.current?.complete();
                  onComplete();
                } else {
                  await nextStep();
                  tourRef.current?.next();
                }
              },
              classes: 'shepherd-button-primary'
            }
          ],
          when: {
            show: () => {
              // Add progress bar
              const element = document.querySelector('.shepherd-content');
              if (element && !element.querySelector('.shepherd-progress')) {
                const progressContainer = document.createElement('div');
                progressContainer.className = 'shepherd-progress';
                const progressBar = document.createElement('div');
                progressBar.className = 'shepherd-progress-bar';
                progressBar.style.width = `${((index + 1) / steps.length) * 100}%`;
                progressContainer.appendChild(progressBar);
                element.appendChild(progressContainer);
              }
            }
          }
        });
      });

      // Handle tour cancel
      tourRef.current.on('cancel', () => {
        onSkip();
      });
    }

    return () => {
      if (tourRef.current) {
        tourRef.current.cancel();
        tourRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only initialize once

  // Start/stop tour based on isActive prop
  useEffect(() => {
    if (tourRef.current) {
      if (isActive && !tourRef.current.isActive()) {
        tourRef.current.start();
        // Go to the current step
        if (currentStep > 0) {
          tourRef.current.show(steps[currentStep].id);
        }
      } else if (!isActive && tourRef.current.isActive()) {
        tourRef.current.cancel();
      }
    }
  }, [isActive, currentStep, steps]);

  // Add custom styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .shepherd-element {
        max-width: 400px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .shepherd-header {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px 8px 0 0;
      }

      .shepherd-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
      }

      .shepherd-text {
        padding: 1.5rem;
        font-size: 1rem;
        line-height: 1.6;
        color: #374151;
      }

      .shepherd-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid #e5e7eb;
        background-color: #f9fafb;
        border-radius: 0 0 8px 8px;
      }

      .shepherd-button {
        margin: 0 0.25rem;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
        cursor: pointer;
      }

      .shepherd-button-primary {
        background-color: #4f46e5;
        color: white;
        border: none;
      }

      .shepherd-button-primary:hover {
        background-color: #4338ca;
      }

      .shepherd-button-secondary {
        background-color: white;
        color: #6b7280;
        border: 1px solid #e5e7eb;
      }

      .shepherd-button-secondary:hover {
        background-color: #f3f4f6;
      }

      .shepherd-modal-overlay-container {
        background-color: rgba(0, 0, 0, 0.4);
      }

      .shepherd-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background-color: #e5e7eb;
        border-radius: 0 0 8px 8px;
        overflow: hidden;
      }

      .shepherd-progress-bar {
        height: 100%;
        background-color: #4f46e5;
        transition: width 0.3s ease;
      }

      .shepherd-cancel-icon {
        color: #6b7280;
      }

      .shepherd-cancel-icon:hover {
        color: #374151;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
