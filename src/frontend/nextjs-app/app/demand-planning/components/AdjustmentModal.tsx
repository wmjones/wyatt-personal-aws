'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AdjustmentType,
  AdjustmentReason,
  TimePeriod,
  HierarchySelection
} from '@/app/types/demand-planning';

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (adjustment: AdjustmentData) => Promise<void>;
  timePeriods: TimePeriod[];
  selectedHierarchies: HierarchySelection[];
  baselineTotal?: number;
}

export interface AdjustmentData {
  type: AdjustmentType;
  value: number;
  timePeriods: string[];
  reason: AdjustmentReason;
  notes?: string;
  hierarchySelections: HierarchySelection[];
}

type FormStep = 'selection' | 'details' | 'preview';

export default function AdjustmentModal({
  isOpen,
  onClose,
  onApply,
  timePeriods,
  selectedHierarchies,
  baselineTotal = 0
}: AdjustmentModalProps) {
  // Modal and focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  // Multi-step form handling
  const [currentStep, setCurrentStep] = useState<FormStep>('selection');

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Default adjustment state
  const [adjustmentData, setAdjustmentData] = useState<AdjustmentData>({
    type: 'percentage',
    value: 5,
    timePeriods: timePeriods.map(tp => tp.id),
    reason: 'marketing-campaign',
    notes: '',
    hierarchySelections: selectedHierarchies
  });

  // Processing state for apply button
  const [isProcessing, setIsProcessing] = useState(false);
  // Custom time period selection mode
  const [timeSelectionMode, setTimeSelectionMode] = useState<'all' | 'custom'>('all');

  // Value warning thresholds
  const WARNING_THRESHOLD_PERCENTAGE = 15; // Show warning for adjustments > 15%
  const WARNING_THRESHOLD_ABSOLUTE = 1000; // Show warning for absolute adjustments > 1000 units

  // Reset form state when the modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('selection');
      setErrors({});

      // Focus the first interactive element when the modal opens
      setTimeout(() => {
        if (initialFocusRef.current) {
          initialFocusRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC key to close the modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Preview calculation
  const getAdjustedTotal = (): number => {
    if (adjustmentData.type === 'percentage') {
      return baselineTotal * (1 + adjustmentData.value / 100);
    } else {
      return baselineTotal + adjustmentData.value;
    }
  };

  // Update the adjustment data when time selection mode changes
  useEffect(() => {
    if (timeSelectionMode === 'all') {
      setAdjustmentData(prev => ({
        ...prev,
        timePeriods: timePeriods.map(tp => tp.id)
      }));
    }
  }, [timeSelectionMode, timePeriods]);

  // Update the hierarchy selections when they change externally
  useEffect(() => {
    setAdjustmentData(prev => ({
      ...prev,
      hierarchySelections: selectedHierarchies
    }));
  }, [selectedHierarchies]);

  // Validate the current step
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate selection step
    if (currentStep === 'selection') {
      if (selectedHierarchies.length === 0) {
        newErrors.hierarchies = 'At least one hierarchy must be selected';
      }

      if (adjustmentData.timePeriods.length === 0) {
        newErrors.timePeriods = 'At least one time period must be selected';
      }
    }

    // Validate details step
    if (currentStep === 'details') {
      if (adjustmentData.value === 0) {
        newErrors.value = 'Adjustment value cannot be zero';
      }

      if (adjustmentData.type === 'percentage' && Math.abs(adjustmentData.value) > 100) {
        newErrors.value = 'Percentage adjustments cannot exceed 100%';
      }

      if (!adjustmentData.reason) {
        newErrors.reason = 'A reason for the adjustment is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep === 'selection') {
        setCurrentStep('details');
      } else if (currentStep === 'details') {
        setCurrentStep('preview');
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'details') {
      setCurrentStep('selection');
    } else if (currentStep === 'preview') {
      setCurrentStep('details');
    }
  };

  // Handle adjustments
  const handleApply = async () => {
    if (isProcessing) return;

    // Final validation before applying
    if (!validateCurrentStep()) {
      return;
    }

    setIsProcessing(true);
    try {
      await onApply(adjustmentData);
      onClose();
    } catch (error) {
      console.error('Error applying adjustment:', error);
      setErrors({submit: 'Failed to apply adjustment. Please try again.'});
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'value') {
      setAdjustmentData(prev => ({
        ...prev,
        value: parseFloat(value) || 0
      }));

      // Clear any existing errors when the user corrects the input
      if (errors.value) {
        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.value;
          return newErrors;
        });
      }
    } else {
      setAdjustmentData(prev => ({
        ...prev,
        [name]: value
      }));

      // Clear any existing errors for this field
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  // Handle time period selection
  const handleTimePeriodChange = (periodId: string, checked: boolean) => {
    setAdjustmentData(prev => {
      const newTimePeriods = checked
        ? [...prev.timePeriods, periodId]
        : prev.timePeriods.filter(id => id !== periodId);

      // Clear time period error if we now have selections
      if (newTimePeriods.length > 0 && errors.timePeriods) {
        setErrors(prevErrors => {
          const newErrors = {...prevErrors};
          delete newErrors.timePeriods;
          return newErrors;
        });
      }

      return {
        ...prev,
        timePeriods: newTimePeriods
      };
    });
  };

  // Check if the adjustment value exceeds warning thresholds
  const isLargeAdjustment = (): boolean => {
    if (adjustmentData.type === 'percentage') {
      return Math.abs(adjustmentData.value) > WARNING_THRESHOLD_PERCENTAGE;
    } else {
      return Math.abs(adjustmentData.value) > WARNING_THRESHOLD_ABSOLUTE;
    }
  };

  if (!isOpen) return null;

  // Get affected hierarchies for display
  const getHierarchyInfo = () => {
    return selectedHierarchies.map(h => {
      const count = h.selectedNodes.length;
      const type = h.type.charAt(0).toUpperCase() + h.type.slice(1);
      return `${type} (${count} selected)`;
    }).join(', ');
  };

  // Calculate adjustment impact
  const adjustedTotal = getAdjustedTotal();
  const absoluteChange = adjustedTotal - baselineTotal;
  const percentageChange = baselineTotal > 0
    ? ((adjustedTotal / baselineTotal) - 1) * 100
    : 0;

  // Render step indicators
  const renderStepIndicators = () => (
    <div className="flex items-center justify-center mb-4">
      <div className="flex space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            currentStep === 'selection' ? 'bg-dp-cfa-red' :
              currentStep === 'details' || currentStep === 'preview' ? 'bg-dp-ui-positive' : 'bg-dp-background-tertiary'
          }`}
        />
        <div
          className={`w-3 h-3 rounded-full ${
            currentStep === 'details' ? 'bg-dp-cfa-red' :
              currentStep === 'preview' ? 'bg-dp-ui-positive' : 'bg-dp-background-tertiary'
          }`}
        />
        <div
          className={`w-3 h-3 rounded-full ${
            currentStep === 'preview' ? 'bg-dp-cfa-red' : 'bg-dp-background-tertiary'
          }`}
        />
      </div>
    </div>
  );

  // Render step-specific content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'selection':
        return (
          <>
            {/* Selected hierarchies */}
            <div>
              <h3 className="text-sm font-medium text-dp-text-primary mb-2">Selected Hierarchies:</h3>
              <div className={`bg-dp-background-tertiary rounded-md p-3 text-sm text-dp-text-secondary ${errors.hierarchies ? 'border border-dp-text-error' : ''}`}>
                {selectedHierarchies.length > 0
                  ? getHierarchyInfo()
                  : 'No hierarchies selected. Please select hierarchies from the sidebar.'}
              </div>
              {errors.hierarchies && <p className="text-dp-text-error text-xs mt-1">{errors.hierarchies}</p>}
            </div>

            {/* Time period selection */}
            <div>
              <h3 className="text-sm font-medium text-dp-text-primary mb-2">Time Period:</h3>
              <div className="flex items-center space-x-4 mb-3">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-dp-cfa-red"
                    checked={timeSelectionMode === 'all'}
                    onChange={() => setTimeSelectionMode('all')}
                  />
                  <span className="ml-2 text-sm">All periods</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-dp-cfa-red"
                    checked={timeSelectionMode === 'custom'}
                    onChange={() => setTimeSelectionMode('custom')}
                  />
                  <span className="ml-2 text-sm">Custom selection</span>
                </label>
              </div>

              {timeSelectionMode === 'custom' && (
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 bg-dp-background-tertiary rounded-md p-3 ${errors.timePeriods ? 'border border-dp-text-error' : ''}`}>
                  {timePeriods.map(period => (
                    <label key={period.id} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox text-dp-cfa-red rounded"
                        checked={adjustmentData.timePeriods.includes(period.id)}
                        onChange={(e) => handleTimePeriodChange(period.id, e.target.checked)}
                      />
                      <span className="ml-2 text-sm">{period.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.timePeriods && <p className="text-dp-text-error text-xs mt-1">{errors.timePeriods}</p>}
            </div>
          </>
        );

      case 'details':
        return (
          <>
            {/* Adjustment type and value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-dp-text-primary mb-2">Adjustment Type:</h3>
                <select
                  name="type"
                  value={adjustmentData.type}
                  onChange={handleInputChange}
                  className="dp-select w-full"
                  aria-label="Adjustment type"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="absolute">Absolute Value (Units)</option>
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-dp-text-primary mb-2">
                  Adjustment Value{adjustmentData.type === 'percentage' ? ' (%)' : ' (Units)'}:
                </h3>
                <input
                  type="number"
                  name="value"
                  value={adjustmentData.value}
                  onChange={handleInputChange}
                  className={`dp-input w-full ${errors.value ? 'border-dp-text-error' : ''}`}
                  step={adjustmentData.type === 'percentage' ? 0.1 : 1}
                  aria-invalid={!!errors.value}
                  aria-describedby={errors.value ? "value-error" : undefined}
                />
                {errors.value && (
                  <p id="value-error" className="text-dp-text-error text-xs mt-1">{errors.value}</p>
                )}
                {isLargeAdjustment() && (
                  <p className="text-dp-text-warning text-xs mt-1">
                    {adjustmentData.type === 'percentage'
                      ? 'Warning: Large percentage adjustments may significantly impact forecasts'
                      : 'Warning: Large unit adjustments may significantly impact forecasts'}
                  </p>
                )}
              </div>
            </div>

            {/* Reason and notes */}
            <div>
              <h3 className="text-sm font-medium text-dp-text-primary mb-2">Reason:</h3>
              <select
                name="reason"
                value={adjustmentData.reason}
                onChange={handleInputChange}
                className={`dp-select w-full mb-4 ${errors.reason ? 'border-dp-text-error' : ''}`}
                aria-invalid={!!errors.reason}
                aria-describedby={errors.reason ? "reason-error" : undefined}
              >
                <option value="marketing-campaign">Marketing Campaign</option>
                <option value="product-performance">Product Performance</option>
                <option value="economic-trends">Economic Trends</option>
                <option value="weather-impact">Weather Impact</option>
                <option value="supply-chain">Supply Chain Issues</option>
                <option value="competitive-activity">Competitive Activity</option>
                <option value="pricing-change">Pricing Change</option>
                <option value="other">Other</option>
              </select>
              {errors.reason && (
                <p id="reason-error" className="text-dp-text-error text-xs -mt-3 mb-4">{errors.reason}</p>
              )}

              <h3 className="text-sm font-medium text-dp-text-primary mb-2">Notes:</h3>
              <textarea
                name="notes"
                value={adjustmentData.notes}
                onChange={handleInputChange}
                className="dp-input w-full min-h-[80px]"
                placeholder="Add optional notes about this adjustment..."
                aria-label="Adjustment notes"
              />
            </div>
          </>
        );

      case 'preview':
        return (
          <>
            {/* Summary of selections */}
            <div className="bg-dp-background-tertiary rounded-md p-4 mb-4">
              <h3 className="text-sm font-medium text-dp-text-primary mb-2">Adjustment Summary:</h3>
              <dl className="grid grid-cols-1 gap-y-2">
                <div className="flex justify-between">
                  <dt className="text-xs text-dp-text-secondary">Hierarchies:</dt>
                  <dd className="text-sm">{getHierarchyInfo()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-dp-text-secondary">Time Periods:</dt>
                  <dd className="text-sm">
                    {adjustmentData.timePeriods.length === timePeriods.length
                      ? 'All periods'
                      : `${adjustmentData.timePeriods.length} selected periods`
                    }
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-dp-text-secondary">Adjustment:</dt>
                  <dd className="text-sm">
                    {adjustmentData.type === 'percentage'
                      ? `${adjustmentData.value > 0 ? '+' : ''}${adjustmentData.value}%`
                      : `${adjustmentData.value > 0 ? '+' : ''}${adjustmentData.value} units`
                    }
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-dp-text-secondary">Reason:</dt>
                  <dd className="text-sm">{adjustmentData.reason.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</dd>
                </div>
              </dl>
            </div>

            {/* Preview impact */}
            {baselineTotal > 0 && (
              <div className="bg-dp-surface-tertiary border border-dp-border-light rounded-md p-4">
                <h3 className="text-sm font-medium text-dp-text-primary mb-3">Impact Preview:</h3>

                {/* Chart preview - simple bar comparison */}
                <div className="mb-4 h-16 flex items-end space-x-1">
                  {/* Baseline bar */}
                  <div className="relative h-full flex-1 flex flex-col justify-end">
                    <div
                      className="bg-dp-chart-color-2 rounded-t"
                      style={{ height: '70%' }}
                    ></div>
                    <div className="absolute bottom-[-20px] w-full text-center text-xs text-dp-text-secondary">
                      Baseline
                    </div>
                  </div>

                  {/* Adjusted bar */}
                  <div className="relative h-full flex-1 flex flex-col justify-end">
                    <div
                      className="bg-dp-chart-color-1 rounded-t"
                      style={{
                        height: baselineTotal > 0
                          ? `${Math.max(10, Math.min(100, (adjustedTotal / baselineTotal) * 70))}%`
                          : '70%'
                      }}
                    ></div>
                    <div className="absolute bottom-[-20px] w-full text-center text-xs text-dp-text-secondary">
                      Adjusted
                    </div>
                  </div>
                </div>

                {/* Numeric impact details */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <div className="text-xs text-dp-text-secondary">Baseline:</div>
                    <div className="text-sm font-medium">{baselineTotal.toLocaleString()} units</div>
                  </div>
                  <div>
                    <div className="text-xs text-dp-text-secondary">Adjusted:</div>
                    <div className="text-sm font-medium">{adjustedTotal.toLocaleString()} units</div>
                  </div>
                  <div>
                    <div className="text-xs text-dp-text-secondary">Absolute Change:</div>
                    <div
                      className={`text-sm font-medium ${
                        absoluteChange > 0
                          ? 'text-dp-ui-positive'
                          : absoluteChange < 0
                            ? 'text-dp-ui-negative'
                            : ''
                      }`}
                    >
                      {absoluteChange > 0 ? '+' : ''}{absoluteChange.toLocaleString()} units
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-dp-text-secondary">Percentage Change:</div>
                    <div
                      className={`text-sm font-medium ${
                        percentageChange > 0
                          ? 'text-dp-ui-positive'
                          : percentageChange < 0
                            ? 'text-dp-ui-negative'
                            : ''
                      }`}
                    >
                      {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General validation error */}
            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-dp-text-error text-sm">
                {errors.submit}
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-25 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjustment-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-dp-surface-primary rounded-lg shadow-dp-medium border border-dp-border-light w-full max-w-2xl max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-dp-border-light">
          <h2 id="adjustment-modal-title" className="text-lg font-medium text-dp-text-primary">
            {currentStep === 'selection' && 'Select Time Periods and Hierarchies'}
            {currentStep === 'details' && 'Specify Adjustment Details'}
            {currentStep === 'preview' && 'Preview and Apply Adjustment'}
          </h2>
          <button
            ref={initialFocusRef}
            onClick={onClose}
            className="text-dp-text-secondary hover:text-dp-text-primary transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicators */}
        {renderStepIndicators()}

        {/* Modal body */}
        <div className="p-6 space-y-6">
          {renderStepContent()}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between p-4 border-t border-dp-border-light">
          <div>
            {currentStep !== 'selection' && (
              <button
                onClick={handlePreviousStep}
                className="dp-btn dp-btn-tertiary"
                disabled={isProcessing}
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="dp-btn dp-btn-tertiary"
              disabled={isProcessing}
            >
              Cancel
            </button>

            {currentStep !== 'preview' ? (
              <button
                onClick={handleNextStep}
                className="dp-btn dp-btn-primary"
                disabled={
                  isProcessing ||
                  (currentStep === 'selection' && (selectedHierarchies.length === 0 || adjustmentData.timePeriods.length === 0))
                }
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleApply}
                className="dp-btn dp-btn-primary"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Apply Adjustment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
