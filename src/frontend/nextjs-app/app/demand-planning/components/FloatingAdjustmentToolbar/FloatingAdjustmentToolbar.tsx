'use client';

import { useState, useEffect } from 'react';
import { FilterSelections } from '../FilterSidebar';
import AdjustmentSlider from './AdjustmentSlider';
import PresetButtons from './PresetButtons';
import ImpactPreview from './ImpactPreview';
import styles from './FloatingAdjustmentToolbar.module.css';

interface FloatingAdjustmentToolbarProps {
  isVisible: boolean;
  onAdjustmentChange: (value: number) => void;
  onSaveAdjustment: (value: number, filterContext: FilterSelections) => Promise<void>;
  filterSelections: FilterSelections;
  className?: string;
}

export default function FloatingAdjustmentToolbar({
  isVisible,
  onAdjustmentChange,
  onSaveAdjustment,
  filterSelections,
  className = ''
}: FloatingAdjustmentToolbarProps) {
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Reset value when toolbar becomes invisible
  useEffect(() => {
    if (!isVisible) {
      setAdjustmentValue(0);
      onAdjustmentChange(0);
    }
  }, [isVisible, onAdjustmentChange]);

  const handleValueChange = (value: number) => {
    setAdjustmentValue(value);
    onAdjustmentChange(value);
  };

  const handleSave = async () => {
    if (adjustmentValue === 0 || isSaving) return;

    setIsSaving(true);
    try {
      await onSaveAdjustment(adjustmentValue, filterSelections);
      setAdjustmentValue(0);
      onAdjustmentChange(0);
    } catch (error) {
      console.error('Failed to save adjustment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.toolbar} ${className}`}
      role="toolbar"
      aria-label="Adjustment toolbar"
    >
      {/* Collapsed state - minimal view */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={styles.expandButton}
          aria-label="Expand adjustment toolbar"
        >
          <span className={styles.adjustmentLabel}>Adjust Forecast</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      )}

      {/* Expanded state - full controls */}
      {isExpanded && (
        <>
          <div className={styles.toolbarHeader}>
            <span className={styles.adjustmentValue}>
              {adjustmentValue > 0 ? '+' : ''}{adjustmentValue}%
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className={styles.collapseButton}
              aria-label="Collapse toolbar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 10l4-4 4 4" />
              </svg>
            </button>
          </div>

          <div className={styles.controlsContainer}>
            <AdjustmentSlider
              value={adjustmentValue}
              onChange={handleValueChange}
              disabled={isSaving}
            />

            <PresetButtons
              onPresetClick={handleValueChange}
              disabled={isSaving}
            />
          </div>

          <ImpactPreview
            adjustmentValue={adjustmentValue}
            filterSelections={filterSelections}
          />

          <button
            onClick={handleSave}
            disabled={adjustmentValue === 0 || isSaving}
            className={styles.saveButton}
          >
            {isSaving ? (
              <>
                <span className={styles.spinner} />
                Saving...
              </>
            ) : (
              'Save Adjustment'
            )}
          </button>
        </>
      )}
    </div>
  );
}
